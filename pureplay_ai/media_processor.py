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
        Applies heavy 51x51 Gaussian blur to specified bounding boxes [x1, y1, x2, y2].
        """
        redacted = frame.copy()
        h, w = frame.shape[:2]

        for box in boxes:
            x1 = max(0, int(box.get("x1", box.get("box", [0, 0, 0, 0])[0])))
            y1 = max(0, int(box.get("y1", box.get("box", [0, 0, 0, 0])[1])))
            x2 = min(w, int(box.get("x2", box.get("box", [0, 0, 0, 0])[2])))
            y2 = min(h, int(box.get("y2", box.get("box", [0, 0, 0, 0])[3])))

            if x2 > x1 and y2 > y1:
                roi = redacted[y1:y2, x1:x2]
                if roi.size > 0:
                    # Apply Gaussian Blur
                    ksize = (
                        self.blur_kernel_size[0] if self.blur_kernel_size[0] % 2 != 0 else self.blur_kernel_size[0] + 1,
                        self.blur_kernel_size[1] if self.blur_kernel_size[1] % 2 != 0 else self.blur_kernel_size[1] + 1
                    )
                    blurred_roi = cv2.GaussianBlur(roi, ksize, 30)
                    
                    # Add child-safe censor outline
                    cv2.rectangle(blurred_roi, (0, 0), (x2 - x1, y2 - y1), (255, 100, 50), 2)
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
                # Check within +- 0.5s window
                for t, b in detections_by_timestamp.items():
                    if abs(float(t) - current_time) <= 0.5:
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
