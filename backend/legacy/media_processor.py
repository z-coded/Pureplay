"""
PurePlay AI — OpenCV & FFmpeg Media Processing Pipeline
Handles video decoding, keyframe extraction, 51x51 Gaussian blur visual redaction,
and 1000 Hz sine-wave audio bleep tone synthesis for profanity masking.
Works seamlessly with OpenCV and includes pure-Python audio fallbacks.
"""

import os
import sys
import math
import struct
import wave
import json
import time
import cv2
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


class PurePlayMediaProcessor:
    """
    OpenCV and audio processing engine for visual blur redaction and bleep tone insertion.
    """
    def __init__(self, blur_kernel_size=(51, 51)):
        self.blur_kernel_size = blur_kernel_size

    def extract_keyframes(self, video_path, sample_fps=1.0, max_frames=120):
        """
        Samples video frames at a fixed frame rate (e.g., 1 frame per second) using OpenCV.
        Returns list of (timestamp_sec, frame_bgr, frame_index).
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video file with OpenCV: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        frame_step = max(1, int(fps / sample_fps))
        keyframes = []
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret or len(keyframes) >= max_frames:
                break

            if frame_idx % frame_step == 0:
                timestamp = round(frame_idx / fps, 2)
                keyframes.append({
                    "timestamp": timestamp,
                    "frame_index": frame_idx,
                    "frame": frame
                })

            frame_idx += 1

        cap.release()
        return {
            "fps": fps,
            "total_frames": total_frames,
            "duration_sec": round(duration, 2),
            "keyframes": keyframes
        }

    def blur_bounding_boxes(self, frame, boxes):
        """
        Applies heavy 51x51 Gaussian blur to specified bounding boxes [x1, y1, x2, y2],
        NudeNet format [x, y, w, h], or full_frame adult scenes.
        """
        redacted = frame.copy()
        h, w = frame.shape[:2]

        for box in boxes:
            if isinstance(box, dict) and box.get("full_frame"):
                # Heavy Gaussian blur across the entire adult frame
                ksize = (
                    self.blur_kernel_size[0] if self.blur_kernel_size[0] % 2 != 0 else self.blur_kernel_size[0] + 1,
                    self.blur_kernel_size[1] if self.blur_kernel_size[1] % 2 != 0 else self.blur_kernel_size[1] + 1
                )
                blurred = cv2.GaussianBlur(redacted, ksize, 30)
                cv2.rectangle(blurred, (0, 0), (w, h), (255, 100, 50), 4)
                return blurred

            raw_box = box.get("box", box) if isinstance(box, dict) else box
            if isinstance(raw_box, (list, tuple)) and len(raw_box) == 4:
                b0, b1, b2, b3 = [int(v) for v in raw_box]
                # If b2 > b0 and b3 > b1, it is [x1, y1, x2, y2]
                if b2 > b0 and b3 > b1 and b2 <= w and b3 <= h:
                    x1, y1, x2, y2 = max(0, b0), max(0, b1), min(w, b2), min(h, b3)
                else:
                    # NudeNet format: [x, y, width, height]
                    x1 = max(0, b0)
                    y1 = max(0, b1)
                    x2 = min(w, b0 + max(20, b2))
                    y2 = min(h, b1 + max(20, b3))
            elif isinstance(box, dict) and "x1" in box:
                x1 = max(0, int(box["x1"]))
                y1 = max(0, int(box["y1"]))
                x2 = min(w, int(box["x2"]))
                y2 = min(h, int(box["y2"]))
            else:
                x1, y1, x2, y2 = 0, 0, w, h

            if x2 > x1 and y2 > y1:
                roi = redacted[y1:y2, x1:x2]
                if roi.size > 0:
                    ksize = (
                        self.blur_kernel_size[0] if self.blur_kernel_size[0] % 2 != 0 else self.blur_kernel_size[0] + 1,
                        self.blur_kernel_size[1] if self.blur_kernel_size[1] % 2 != 0 else self.blur_kernel_size[1] + 1
                    )
                    blurred_roi = cv2.GaussianBlur(roi, ksize, 30)
                    cv2.rectangle(blurred_roi, (0, 0), (x2 - x1, y2 - y1), (255, 100, 50), 3)
                    redacted[y1:y2, x1:x2] = blurred_roi

        return redacted

    def generate_bleep_wav(self, duration_sec=1.0, freq=1000, sample_rate=44100):
        """
        Synthesizes a pure 1000 Hz audio sine-wave bleep tone buffer (standard FCC censor tone).
        """
        num_samples = int(duration_sec * sample_rate)
        audio_data = bytearray()
        
        for i in range(num_samples):
            # 1000 Hz sine wave
            val = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * freq * (i / sample_rate)))
            audio_data.extend(struct.pack('<h', val))
            
        return bytes(audio_data)

    def create_synthetic_audio_track(self, output_wav_path, duration_sec=10.0, bleep_intervals=None):
        """
        Creates a clean audio track with standard speech tone, inserting 1000 Hz bleeps
        at all specified redaction intervals.
        """
        sample_rate = 44100
        total_samples = int(duration_sec * sample_rate)
        bleep_intervals = bleep_intervals or []

        # Convert intervals to sample indices
        bleep_ranges = []
        for interval in bleep_intervals:
            s = int(interval.get("start", 0.0) * sample_rate)
            e = int(interval.get("end", 0.0) * sample_rate)
            bleep_ranges.append((s, e))

        with wave.open(output_wav_path, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)

            audio_data = bytearray()
            for i in range(total_samples):
                is_bleep = any(s <= i <= e for s, e in bleep_ranges)
                if is_bleep:
                    # 1000 Hz censor tone
                    sample_val = int(32767.0 * 0.45 * math.sin(2.0 * math.pi * 1000.0 * (i / sample_rate)))
                else:
                    # Gentle ambient background room tone
                    sample_val = int(32767.0 * 0.03 * math.sin(2.0 * math.pi * 220.0 * (i / sample_rate)))
                audio_data.extend(struct.pack('<h', sample_val))

            wav_file.writeframes(bytes(audio_data))

        return output_wav_path

    def process_and_redact_video(self, input_video_path, output_video_path, detections_by_timestamp=None):
        """
        Reads input video frame-by-frame, blurs detected NSFW bounding boxes,
        and writes out the safe redacted video using OpenCV VideoWriter.
        """
        if not os.path.exists(input_video_path):
            raise FileNotFoundError(f"Input video not found: {input_video_path}")

        detections_by_timestamp = detections_by_timestamp or {}
        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open input video: {input_video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # mp4v codec for universal Windows/Web playback
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        frame_count = 0
        redacted_frames_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            current_time = round(frame_count / fps, 1)
            # Find nearest detection timestamp
            boxes = detections_by_timestamp.get(current_time, [])
            if not boxes:
                # Check within +- 0.8s window so 1fps samples cover the entire sequence
                for t, b in detections_by_timestamp.items():
                    if abs(float(t) - current_time) <= 0.8:
                        boxes = b
                        break

            if boxes:
                frame = self.blur_bounding_boxes(frame, boxes)
                redacted_frames_count += 1

            out.write(frame)
            frame_count += 1

        cap.release()
        out.release()

        return {
            "input_video": input_video_path,
            "output_video": output_video_path,
            "total_frames": frame_count,
            "redacted_frames": redacted_frames_count,
            "resolution": f"{width}x{height}",
            "fps": fps
        }

    def censor_multi_modal_video(
        self,
        input_video_path: str,
        output_video_path: str,
        detections_by_timestamp: dict = None,
        bleep_intervals: list = None,
        blur_ksize: int = 51
    ):
        """
        Unified multi-modal censoring pipeline:
        1. Reads input video, applies 51x51 Gaussian blur to detected bounding boxes.
        2. Extracts audio, mutes/bleeps detected profanity intervals with 1000 Hz tone.
        3. Muxes video & audio with FFmpeg (H.264 / AAC) into child-safe output MP4.
        """
        import imageio_ffmpeg
        import subprocess
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        temp_dir = os.path.dirname(output_video_path)
        timestamp_id = int(time.time() * 1000)
        temp_video_avi = os.path.join(temp_dir, f"_temp_vid_{timestamp_id}.avi")
        temp_audio_in = os.path.join(temp_dir, f"_temp_aud_{timestamp_id}.wav")
        temp_audio_out = os.path.join(temp_dir, f"_temp_aud_censored_{timestamp_id}.wav")

        try:
            # 1. Process Video Frames (Visual Gaussian Blur)
            vid_res = self.process_and_redact_video(
                input_video_path,
                temp_video_avi,
                detections_by_timestamp=detections_by_timestamp
            )

            # 2. Extract & Censor Audio
            bleep_intervals = bleep_intervals or []
            has_audio = False
            try:
                cmd_ext = [
                    ffmpeg_exe, "-y",
                    "-i", input_video_path,
                    "-vn", "-ar", "44100", "-ac", "1",
                    temp_audio_in
                ]
                res_ext = subprocess.run(cmd_ext, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res_ext.returncode == 0 and os.path.exists(temp_audio_in) and os.path.getsize(temp_audio_in) > 1000:
                    has_audio = True
            except Exception as e:
                print(f"[WARN] Audio extraction failed: {e}")

            if has_audio:
                with wave.open(temp_audio_in, 'rb') as w_in:
                    rate = w_in.getframerate()
                    n_frames = w_in.getnframes()
                    audio_data = np.frombuffer(w_in.readframes(n_frames), dtype=np.int16).copy()

                for interval in bleep_intervals:
                    s_idx = max(0, int(float(interval.get("start", 0)) * rate))
                    e_idx = min(len(audio_data), int(float(interval.get("end", 0)) * rate))
                    if e_idx > s_idx:
                        # Mute original voice
                        audio_data[s_idx:e_idx] = 0
                        # Insert 1000 Hz FCC censor bleep tone
                        t_bleep = np.arange(e_idx - s_idx) / rate
                        bleep = (np.sin(2 * np.pi * 1000.0 * t_bleep) * 12000).astype(np.int16)
                        audio_data[s_idx:e_idx] = bleep

                with wave.open(temp_audio_out, 'wb') as w_out:
                    w_out.setnchannels(1)
                    w_out.setsampwidth(2)
                    w_out.setframerate(rate)
                    w_out.writeframes(audio_data.tobytes())

                # 3. Mux Video + Censored Audio
                cmd_mux = [
                    ffmpeg_exe, "-y",
                    "-i", temp_video_avi,
                    "-i", temp_audio_out,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k",
                    "-shortest",
                    output_video_path
                ]
                subprocess.run(cmd_mux, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            else:
                # Video-only fallback
                cmd_mux = [
                    ffmpeg_exe, "-y",
                    "-i", temp_video_avi,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                    "-pix_fmt", "yuv420p",
                    output_video_path
                ]
                subprocess.run(cmd_mux, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

            return {
                "success": True,
                "output_video": output_video_path,
                "redacted_frames": vid_res.get("redacted_frames", 0),
                "bleep_intervals_applied": len(bleep_intervals)
            }
        finally:
            for f in [temp_video_avi, temp_audio_in, temp_audio_out]:
                if os.path.exists(f):
                    try:
                        os.remove(f)
                    except Exception:
                        pass



# Singleton instance
media_processor_instance = None

def get_media_processor():
    global media_processor_instance
    if media_processor_instance is None:
        media_processor_instance = PurePlayMediaProcessor()
    return media_processor_instance


if __name__ == "__main__":
    processor = PurePlayMediaProcessor()
    test_wav = os.path.join(os.path.dirname(__file__), "test_bleep.wav")
    processor.create_synthetic_audio_track(
        test_wav,
        duration_sec=4.0,
        bleep_intervals=[{"start": 1.0, "end": 2.2}]
    )
    print(f"[TEST] Created synthetic censored audio track: {test_wav}")
    if os.path.exists(test_wav):
        os.remove(test_wav)
