"""
PurePlay AI — OpenNSFW2 Visual Classifier Engine
Provides frame-level adult content probability scoring (0.0 to 1.0)
using Yahoo OpenNSFW ResNet architecture via PyTorch and ONNX Runtime.
"""

import os
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import onnxruntime as ort


class OpenNSFW2ResNet(nn.Module):
    """
    Yahoo OpenNSFW architecture adaptation using ResNet-50 / ResNet-18 backbone.
    Outputs binary probability: [Safe (0), NSFW (1)].
    """
    def __init__(self, pretrained=True, num_classes=2):
        super(OpenNSFW2ResNet, self).__init__()
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        base_model = models.resnet18(weights=weights)
        self.features = nn.Sequential(*list(base_model.children())[:-1])
        in_features = base_model.fc.in_features
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        feats = self.features(x)
        feats = torch.flatten(feats, 1)
        logits = self.classifier(feats)
        return logits


class PurePlayOpenNSFW2Engine:
    """
    Inference engine for OpenNSFW2 visual content moderation.
    Supports ONNX Runtime (CPU/GPU) with PyTorch fallback.
    """
    def __init__(self, onnx_model_path=None, pt_model_path=None, threshold=0.20):
        self.threshold = threshold
        self.onnx_path = onnx_model_path or os.path.join(os.path.dirname(__file__), "pureplay_opennsfw2_trained.onnx")
        self.pt_path = pt_model_path or os.path.join(os.path.dirname(__file__), "pureplay_opennsfw2_trained.pt")
        
        self.ort_session = None
        self.pt_model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])

        self._load_model()

    def _load_model(self):
        # 1. Try ONNX Runtime
        if os.path.exists(self.onnx_path):
            try:
                self.ort_session = ort.InferenceSession(self.onnx_path, providers=['CPUExecutionProvider'])
                self.input_name = self.ort_session.get_inputs()[0].name
                print(f"[OpenNSFW2] Loaded trained ONNX model: {self.onnx_path}")
                return
            except Exception as e:
                print(f"[OpenNSFW2] ONNX load error: {e}")

        # 2. Try PyTorch Checkpoint
        self.pt_model = OpenNSFW2ResNet(pretrained=False, num_classes=2)
        if os.path.exists(self.pt_path):
            try:
                state_dict = torch.load(self.pt_path, map_location=self.device)
                self.pt_model.load_state_dict(state_dict)
                print(f"[OpenNSFW2] Loaded trained PyTorch weights: {self.pt_path}")
            except Exception as e:
                print(f"[OpenNSFW2] Checkpoint load warning: {e}, using pretrained initialization.")
                self.pt_model = OpenNSFW2ResNet(pretrained=True, num_classes=2)
        else:
            self.pt_model = OpenNSFW2ResNet(pretrained=True, num_classes=2)
            
        self.pt_model.to(self.device)
        self.pt_model.eval()

    def predict_image(self, image_input):
        """
        Accepts PIL Image, cv2 BGR numpy array, or file path.
        Returns float: nsfw_probability (0.0 to 1.0)
        """
        if isinstance(image_input, str):
            image = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, np.ndarray):
            rgb = cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(rgb)
        elif isinstance(image_input, Image.Image):
            image = image_input.convert("RGB")
        else:
            raise ValueError("Unsupported image input type")

        tensor = self.transform(image).unsqueeze(0)

        if self.ort_session is not None:
            inp = {self.input_name: tensor.numpy()}
            logits = self.ort_session.run(None, inp)[0]
            exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
            probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
            nsfw_score = float(probs[0][1])
            return nsfw_score

        with torch.no_grad():
            tensor = tensor.to(self.device)
            logits = self.pt_model(tensor)
            probs = torch.softmax(logits, dim=1)
            nsfw_score = float(probs[0][1].item())
            return nsfw_score

    def analyze_image(self, image_input, threshold=None):
        """
        Evaluates adult content probability and returns structured moderation report.
        """
        score = self.predict_image(image_input)
        th = threshold if threshold is not None else self.threshold
        return {
            "nsfw_score": round(score, 4),
            "is_nsfw": score >= th,
            "threshold": th,
            "status": "NSFW" if score >= th else "SAFE"
        }

    def analyze_video(self, video_path, sample_fps=2.0):
        """
        Samples video frames with OpenCV, evaluates OpenNSFW2 score,
        and generates an XAI violation timeline.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {
                "success": False,
                "error": f"Failed to open video: {video_path}"
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(round(fps / sample_fps)))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames > 0 and (total_frames / frame_interval) > 35:
            frame_interval = max(frame_interval, total_frames // 35)
        duration = total_frames / fps if fps > 0 else 0

        timeline = []
        scores = []
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                timestamp = round(frame_idx / fps, 2)
                score = self.predict_image(frame)
                scores.append(score)

                is_flagged = score >= self.threshold
                timeline.append({
                    "timestamp": timestamp,
                    "frame": frame_idx,
                    "nsfw_score": round(score, 4),
                    "status": "flagged" if is_flagged else "safe",
                    "action": "blur_required" if is_flagged else "none"
                })

            frame_idx += 1

        cap.release()

        peak_score = max(scores) if scores else 0.0
        avg_score = float(np.mean(scores)) if scores else 0.0
        flagged_count = sum(1 for s in scores if s >= self.threshold)

        return {
            "success": True,
            "engine": "OpenNSFW2",
            "video_path": video_path,
            "duration": round(duration, 2),
            "sampled_frames": len(scores),
            "overall_score": round(peak_score, 4),
            "peak_nsfw_score": round(peak_score, 4),
            "avg_nsfw_score": round(avg_score, 4),
            "flagged_frames": flagged_count,
            "decision": "Flagged" if peak_score >= self.threshold else "Approved",
            "timeline": timeline
        }

    def analyze_video_frames(self, video_path, sample_fps=2.0):
        """Alias for analyze_video with frame-by-frame analysis."""
        return self.analyze_video(video_path, sample_fps=sample_fps)
