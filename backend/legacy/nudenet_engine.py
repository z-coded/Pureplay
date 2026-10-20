"""
PurePlay AI Censorship Engine
Powered by NudeNet (ONNX) and OpenCV

Analyzes videos frame-by-frame for adult/NSFW content, generates
explainable AI (XAI) timeline data, and applies automated bounding-box blurring.
"""

import os
import cv2
import numpy as np
from nudenet import NudeDetector

# Classes that represent explicit / policy-violating content for child-safe platforms
EXPLICIT_LABELS = {
    "FEMALE_GENITALIA_EXPOSED": "Exposed Female Genitalia",
    "MALE_GENITALIA_EXPOSED": "Exposed Male Genitalia",
    "FEMALE_BREAST_EXPOSED": "Exposed Breast",
    "BUTTOCKS_EXPOSED": "Exposed Buttocks",
    "ANUS_EXPOSED": "Exposed Anus",
}

# Classes that are suggestive / borderline
SUGGESTIVE_LABELS = {
    "MALE_BREAST_EXPOSED": "Shirtless Male",
    "BELLY_EXPOSED": "Exposed Midriff",
    "FEMALE_BREAST_COVERED": "Covered Breast (Cleavage)",
    "BUTTOCKS_COVERED": "Swimwear / Covered Buttocks",
    "FEMALE_GENITALIA_COVERED": "Swimwear / Undergarment",
}


class PurePlayNudeNetEngine:
    def __init__(self, model_path: str = None, default_threshold: float = 0.45):
        """
        Initialize NudeDetector ONNX engine.
        :param model_path: Optional custom ONNX weights path (e.g., fine-tuned model).
        :param default_threshold: Detection confidence cutoff (0.0 - 1.0).
        """
        print(f"[*] Initializing PurePlay NudeNet Engine (model: {model_path or 'pre-trained 320n.onnx'})...")
        self.detector = NudeDetector(model_path=model_path) if model_path else NudeDetector()
        self.default_threshold = default_threshold
        print("[+] PurePlay NudeNet Engine ready.")

    def analyze_image(self, image_path: str, threshold: float = None):
        """
        Analyze a single image or frame.
        """
        t = threshold if threshold is not None else self.default_threshold
        detections = self.detector.detect(image_path)
        
        explicit_hits = []
        all_hits = []

        for d in detections:
            cls = d["class"]
            score = float(d["score"])
            box = d["box"]

            if score >= t:
                item = {
                    "class": cls,
                    "label": EXPLICIT_LABELS.get(cls, SUGGESTIVE_LABELS.get(cls, cls)),
                    "confidence": round(score, 3),
                    "is_explicit": cls in EXPLICIT_LABELS,
                    "box": box, # [x, y, w, h]
                }
                all_hits.append(item)
                if item["is_explicit"]:
                    explicit_hits.append(item)

        is_flagged = len(explicit_hits) > 0
        peak_score = max([d["confidence"] for d in explicit_hits], default=0.0)

        return {
            "is_flagged": is_flagged,
            "peak_nsfw_score": peak_score,
            "detections": all_hits,
            "explicit_count": len(explicit_hits),
        }

    def analyze_video(self, video_path: str, sample_fps: float = 2.0, threshold: float = None):
        """
        Extract video frames at sample_fps, run NudeNet detection,
        and build the XAI Heatmap timeline + moderation summary.

        :param video_path: Path to target .mp4 or .webm file.
        :param sample_fps: Number of frames to sample per second of video.
        :param threshold: Detection threshold cutoff.
        """
        t = threshold if threshold is not None else self.default_threshold

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"OpenCV could not open video: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_seconds = total_video_frames / video_fps if total_video_frames > 0 else 0.0

        # Determine frame skip interval
        frame_interval = max(1, int(video_fps / sample_fps))
        if total_video_frames > 0 and (total_video_frames / frame_interval) > 35:
            frame_interval = max(frame_interval, total_video_frames // 35)

        frame_index = 0
        analyzed_frames = 0
        frame_results = []
        all_violations = []

        # Temporary folder for dumping sampled frames for NudeDetector
        temp_dir = os.path.join(os.path.dirname(video_path), "_temp_frames")
        os.makedirs(temp_dir, exist_ok=True)

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_index % frame_interval == 0:
                    current_sec = frame_index / video_fps
                    analyzed_frames += 1

                    # Save temporary frame
                    temp_frame_path = os.path.join(temp_dir, f"frame_{frame_index}.jpg")
                    cv2.imwrite(temp_frame_path, frame)

                    # Run detector
                    res = self.analyze_image(temp_frame_path, threshold=t)

                    # Clean up frame immediately
                    if os.path.exists(temp_frame_path):
                        os.remove(temp_frame_path)

                    frame_entry = {
                        "frame_index": frame_index,
                        "timestamp_seconds": round(current_sec, 2),
                        "timestamp_percent": round((current_sec / max(duration_seconds, 1.0)) * 100, 1),
                        "is_flagged": res["is_flagged"] or any(d.get("class") in SUGGESTIVE_LABELS for d in res["detections"]),
                        "peak_score": res["peak_nsfw_score"],
                        "detections": res["detections"],
                    }
                    frame_results.append(frame_entry)

                    if frame_entry["is_flagged"]:
                        all_violations.append(frame_entry)

                frame_index += 1

        finally:
            cap.release()
            # Clean up temp folder
            if os.path.exists(temp_dir):
                try:
                    for f in os.listdir(temp_dir):
                        os.remove(os.path.join(temp_dir, f))
                    os.rmdir(temp_dir)
                except Exception:
                    pass

        # Aggregate metrics
        flagged_frame_count = len(all_violations)
        violation_ratio = round(flagged_frame_count / max(analyzed_frames, 1), 3)
        overall_peak_score = max([v["peak_score"] for v in all_violations], default=0.0)

        # SDS Status determination: Flagged vs Approved
        status = "Flagged" if overall_peak_score >= t or flagged_frame_count > 0 else "Approved"

        # Generate Explainable AI (XAI) timeline intervals
        timeline = self._generate_xai_timeline(frame_results, duration_seconds)

        return {
            "status": status,
            "overall_nsfw_score": round(overall_peak_score, 3),
            "violation_ratio": violation_ratio,
            "duration_seconds": round(duration_seconds, 2),
            "total_frames": total_video_frames,
            "analyzed_frames": analyzed_frames,
            "flagged_frames": flagged_frame_count,
            "violations_detected": [
                {
                    "timestamp": v["timestamp_seconds"],
                    "timestamp_percent": v["timestamp_percent"],
                    "peak_score": v["peak_score"],
                    "labels": [d["label"] for d in v["detections"] if d["is_explicit"] or d.get("class") in SUGGESTIVE_LABELS],
                    "classes": [d.get("class", d["label"]) for d in v["detections"] if d["is_explicit"] or d.get("class") in SUGGESTIVE_LABELS],
                    "scores": [d["confidence"] for d in v["detections"] if d["is_explicit"] or d.get("class") in SUGGESTIVE_LABELS],
                    "boxes": [d["box"] for d in v["detections"] if d["is_explicit"] or d.get("class") in SUGGESTIVE_LABELS],
                }
                for v in all_violations
            ],
            "timeline": timeline,
        }

    def _generate_xai_timeline(self, frame_results, duration_seconds):
        """
        Merges consecutive frames into timeline segments (safe vs nsfw)
        for rendering in the PurePlay XAI Heatmap component.
        """
        if not frame_results:
            return [{"start": 0, "end": 100, "type": "safe"}]

        timeline_segments = []
        current_type = "nsfw" if frame_results[0]["is_flagged"] else "safe"
        segment_start = 0.0
        peak_conf = frame_results[0]["peak_score"]
        current_label = (
            frame_results[0]["detections"][0]["label"]
            if frame_results[0]["detections"]
            else "Explicit Content"
        )

        for i in range(1, len(frame_results)):
            item = frame_results[i]
            item_type = "nsfw" if item["is_flagged"] else "safe"

            if item_type != current_type:
                # Close previous segment
                segment_end = item["timestamp_percent"]
                timeline_segments.append({
                    "start": round(segment_start, 1),
                    "end": round(segment_end, 1),
                    "type": current_type,
                    "label": current_label if current_type == "nsfw" else "Safe",
                    "confidence": round(peak_conf, 2) if current_type == "nsfw" else None,
                })
                current_type = item_type
                segment_start = segment_end
                peak_conf = item["peak_score"]
                current_label = (
                    item["detections"][0]["label"]
                    if item["detections"]
                    else "Explicit Content"
                )
            else:
                if item["peak_score"] > peak_conf:
                    peak_conf = item["peak_score"]

        # Close final segment
        timeline_segments.append({
            "start": round(segment_start, 1),
            "end": 100.0,
            "type": current_type,
            "label": current_label if current_type == "nsfw" else "Safe",
            "confidence": round(peak_conf, 2) if current_type == "nsfw" else None,
        })

        return timeline_segments

    def censor_video(self, input_video: str, output_video: str, blur_ksize: int = 51):
        """
        Applies automated Gaussian blur redaction to all detected explicit bounding boxes
        and encodes a child-safe sanitized video stream.
        """
        cap = cv2.VideoCapture(input_video)
        if not cap.isOpened():
            raise ValueError(f"Could not open {input_video}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

        temp_img = "_censor_tmp.jpg"
        print(f"[*] Censoring video: {input_video} -> {output_video}")

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                cv2.imwrite(temp_img, frame)
                detections = self.detector.detect(temp_img)

                # Blur any explicit region
                for d in detections:
                    if d["class"] in EXPLICIT_LABELS:
                        x, y, w, h = d["box"]
                        x1 = max(0, x)
                        y1 = max(0, y)
                        x2 = min(width, x + w)
                        y2 = min(height, y + h)

                        if x2 > x1 and y2 > y1:
                            roi = frame[y1:y2, x1:x2]
                            blurred_roi = cv2.GaussianBlur(roi, (blur_ksize, blur_ksize), 30)
                            frame[y1:y2, x1:x2] = blurred_roi

                out.write(frame)
        finally:
            cap.release()
            out.release()
            if os.path.exists(temp_img):
                os.remove(temp_img)

        print(f"[+] Censored video created: {output_video}")
        return output_video
