"""FYP filtering pipeline: pretrained models, timed cuts, output rescan.

Model confidence is not a child-safety probability. Guardian review is required.
VideoMAE weights: MCG-NJU/videomae-base-finetuned-kinetics, CC-BY-NC-4.0.
"""
import subprocess
import tempfile
from collections import deque
from pathlib import Path

import numpy as np
import torch
from nudenet import NudeDetector
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification

from cut_media import probe, plan_cuts, render_cuts, run
from speech_policy import speech_events

MODEL_PATH = "/opt/models/videomae"
SAMPLE_FPS = 4
WINDOW_FRAMES = 16
STRIDE_FRAMES = 8
MAX_DURATION = 180
NUDITY_CLASSES = {
    "FEMALE_GENITALIA_EXPOSED", "MALE_GENITALIA_EXPOSED",
    "FEMALE_BREAST_EXPOSED", "BUTTOCKS_EXPOSED", "ANUS_EXPOSED",
}


class FilteringPipeline:
    def __init__(self):
        import whisper
        torch.set_num_threads(2)
        self.nudity = NudeDetector()
        self.processor = VideoMAEImageProcessor.from_pretrained(MODEL_PATH, local_files_only=True)
        self.action = VideoMAEForVideoClassification.from_pretrained(
            MODEL_PATH, local_files_only=True).eval()
        self.kissing_id = next(int(key) for key, value in self.action.config.id2label.items()
                               if value.lower() == "kissing")
        self.whisper = whisper.load_model("base", device="cpu")

    def kissing(self, frames):
        # Preserve the full image rather than center-cropping away people.
        inputs = self.processor(list(frames), return_tensors="pt", do_center_crop=False,
                                size={"height": 224, "width": 224})
        with torch.inference_mode():
            probabilities = self.action(**inputs).logits.softmax(-1)[0]
        score = float(probabilities[self.kissing_id])
        # Starting operating point, explicitly not calibrated on the user's clips.
        return score, score >= 0.10 or int(probabilities.argmax()) == self.kissing_id

    def scan_visuals(self, source, duration):
        events, window, sampled = [], deque(maxlen=WINDOW_FRAMES), 0
        # A pipe keeps memory bounded and FFmpeg normalizes variable frame rates.
        command = ["ffmpeg", "-nostdin", "-v", "error", "-i", str(source),
                   "-an", "-vf", f"fps={SAMPLE_FPS},scale=320:320:force_original_aspect_ratio=decrease,"
                   "pad=320:320:(ow-iw)/2:(oh-ih)/2", "-pix_fmt", "rgb24",
                   "-f", "rawvideo", "-"]
        last_window_end = 0
        with tempfile.TemporaryFile() as errors:
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=errors)
            try:
                while True:
                    raw = process.stdout.read(320 * 320 * 3)
                    if not raw:
                        break
                    if len(raw) != 320 * 320 * 3:
                        raise RuntimeError("Truncated decoded frame")
                    frame = np.frombuffer(raw, dtype=np.uint8).reshape(320, 320, 3)
                    timestamp = sampled / SAMPLE_FPS
                    window.append(frame)
                    # NudeNet at 2 fps across the entire video; no 35-frame cap.
                    if sampled % 2 == 0:
                        detections = self.nudity.detect(frame[:, :, ::-1].copy())
                        for detection in detections:
                            if detection["class"] in NUDITY_CLASSES and detection["score"] >= 0.40:
                                events.append({"start": max(0, timestamp - 0.5),
                                               "end": min(duration, timestamp + 0.5),
                                               "reason": "nudity",
                                               "score": float(detection["score"])})
                    sampled += 1
                    if len(window) == WINDOW_FRAMES and (sampled - WINDOW_FRAMES) % STRIDE_FRAMES == 0:
                        score, flagged = self.kissing(window)
                        if flagged:
                            events.append({"start": (sampled - WINDOW_FRAMES) / SAMPLE_FPS,
                                           "end": min(duration, sampled / SAMPLE_FPS),
                                           "reason": "kissing", "score": score})
                        last_window_end = sampled
                    if sampled > (MAX_DURATION + 2) * SAMPLE_FPS:
                        raise ValueError("Decoded video exceeds the three-minute demo limit")
                if window and last_window_end != sampled:
                    frames = list(window)
                    frames += [frames[-1]] * (WINDOW_FRAMES - len(frames))
                    score, flagged = self.kissing(frames)
                    if flagged:
                        events.append({"start": max(0, (sampled - WINDOW_FRAMES) / SAMPLE_FPS),
                                       "end": duration, "reason": "kissing", "score": score})
                if process.wait(timeout=30):
                    errors.seek(0)
                    raise RuntimeError("Video decoding failed: " + errors.read().decode(errors="replace")[-500:])
            finally:
                process.stdout.close()
                if process.poll() is None:
                    process.kill()
                    process.wait()
        if sampled < max(1, int(duration * SAMPLE_FPS) - 2):
            raise RuntimeError("Visual scan did not cover the full video")
        return events, sampled

    def scan(self, source):
        metadata = probe(source)
        if metadata["duration"] > MAX_DURATION:
            raise ValueError("FYP demo accepts clips up to three minutes; trim this video first")
        events, sampled = self.scan_visuals(source, metadata["duration"])
        language = None
        if metadata["has_audio"]:
            # Decoding failures propagate; they are never treated as silent media.
            # Analyze the same first audio stream that render_cuts publishes.
            with tempfile.TemporaryDirectory() as temporary:
                audio = Path(temporary) / "speech.wav"
                run(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-y",
                     "-i", str(source), "-map", "0:a:0", "-vn",
                     "-af", "aresample=async=1:first_pts=0",
                     "-ac", "1", "-ar", "16000", str(audio)])
                transcript = self.whisper.transcribe(str(audio), word_timestamps=True,
                                                    fp16=False, temperature=0)
            language = transcript.get("language")
            events += speech_events(transcript)
        return {"events": events, "sampled_frames": sampled,
                "language": language, **metadata}

    def process(self, source, destination):
        initial = self.scan(source)
        plan = plan_cuts(initial["duration"], initial["events"])
        rendered = render_cuts(source, destination, plan)
        # Scan joins and retained scenes too; reject residual findings rather than
        # quietly publishing a still-flagged render.
        verification = self.scan(destination)
        if verification["events"]:
            Path(destination).unlink(missing_ok=True)
            raise ValueError("The edited video still contains detected policy violations. "
                             "No playback was published; use a shorter clip or manual editing.")
        warnings = [
            "Guardian review required: detection can miss brief scenes, obscured nudity or speech.",
            "Kissing threshold is provisional; accuracy has not been measured on your demo clips.",
            "English profanity vocabulary only; euphemisms, transcription errors and other languages may be missed.",
        ]
        if initial["language"] not in (None, "en"):
            warnings.append("Non-English speech detected; the profanity policy does not cover this language.")
        return {
            "success": True,
            "pipeline_version": "cuts-v1",
            "guardrail_verdict": {
                "guardrail_engine": "PurePlay interval policy v1",
                "decision": "FILTERED_REVIEW_REQUIRED",
                "safety_status": "REVIEW_REQUIRED",
                "policy_reason": "Filtered output passed a second automated scan. "
                                 "A guardian must review it before sharing with a child.",
                "review_required": True,
                "verification_passed": True,
                "removed_seconds": round(plan["removed_seconds"], 2),
                "removed_intervals": plan["removed_intervals"],
                "original_duration": initial["duration"],
                "output_duration": rendered["duration"],
                "warnings": warnings,
            },
            "edit_plan": plan,
            "verification": {"passed": True, "sampled_frames": verification["sampled_frames"],
                             "audio_present": verification["has_audio"]},
            "models": {"nudity": "NudeNet 320n", "kissing": "VideoMAE Kinetics-400",
                       "speech": "OpenAI Whisper base", "profanity": "English vocabulary v1"},
        }
