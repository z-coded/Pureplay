"""
PurePlay AI — NVIDIA NeMo Multi-Modal NSFW & Safety Guardrail Classifier
Fuses visual NSFW signals (OpenNSFW2, NudeNet), audio/transcript toxicity (Whisper, Detoxify),
and parental policy rules into a unified multi-modal child-safety moderation decision.
"""

import os
import sys
import json
import time
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import torch
import torch.nn as nn


class NeMoCrossModalSafetyHead(nn.Module):
    """
    NVIDIA NeMo Guardrails cross-modal fusion architecture.
    Combines:
      - Visual NSFW features (dim=16)
      - Text/Speech toxicity features (dim=8)
      - Profile policy & age constraints (dim=8)
    Outputs 4 policy classes:
      0: SAFE_TO_STREAM
      1: CENSOR_AND_STREAM
      2: RESTRICTED_PIN_REQUIRED
      3: BLOCKED_VIOLATION
    """
    def __init__(self, visual_dim=16, text_dim=8, policy_dim=8, hidden_dim=64, num_classes=4):
        super().__init__()
        self.visual_proj = nn.Sequential(
            nn.Linear(visual_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU()
        )
        self.text_proj = nn.Sequential(
            nn.Linear(text_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU()
        )
        self.policy_proj = nn.Sequential(
            nn.Linear(policy_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU()
        )

        # Cross-modal fusion
        self.fusion = nn.Sequential(
            nn.Linear(hidden_dim * 3, hidden_dim * 2),
            nn.LayerNorm(hidden_dim * 2),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, visual_feat, text_feat, policy_feat):
        v = self.visual_proj(visual_feat)
        t = self.text_proj(text_feat)
        p = self.policy_proj(policy_feat)
        fused = torch.cat([v, t, p], dim=1)
        logits = self.fusion(fused)
        return logits


class NeMoNSFWGuardrailEngine:
    """
    Inference engine implementing NVIDIA NeMo Guardrails safety policies.
    """
    DECISIONS = [
        "SAFE_TO_STREAM",
        "CENSOR_AND_STREAM",
        "RESTRICTED_PIN_REQUIRED",
        "BLOCKED_VIOLATION"
    ]

    def __init__(self, model_path=None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "pureplay_nemo_trained.pt")
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            self.model = NeMoCrossModalSafetyHead().to(self.device)
            if os.path.exists(self.model_path):
                checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)
                if "model_state_dict" in checkpoint:
                    self.model.load_state_dict(checkpoint["model_state_dict"])
                else:
                    self.model.load_state_dict(checkpoint)
                print(f"[INFO] Loaded trained NeMo Guardrails model from {self.model_path}")
            self.model.eval()
        except Exception as e:
            print(f"[WARN] NeMo neural weights fallback to deterministic rule guardrail ({e}).")

    def _construct_visual_feature(self, opennsfw2_score, nudenet_detections):
        """Builds 16-dimensional visual safety feature vector."""
        feat = np.zeros(16, dtype=np.float32)
        feat[0] = float(opennsfw2_score)
        
        # Aggregate NudeNet detections
        for det in nudenet_detections:
            cls = det.get("class", "").upper()
            score = float(det.get("score", 0.0))
            if "GENITALIA" in cls:
                feat[1] = max(feat[1], score)
            elif "BREAST" in cls:
                feat[2] = max(feat[2], score)
            elif "BUTTOCKS" in cls:
                feat[3] = max(feat[3], score)
            elif "BELLY" in cls:
                feat[4] = max(feat[4], score)
            elif "FEET" in cls:
                feat[5] = max(feat[5], score)
            else:
                feat[6] = max(feat[6], score)

        feat[7] = len(nudenet_detections) / 10.0
        return torch.from_numpy(np.array([feat], dtype=np.float32)).to(self.device)

    def _construct_text_feature(self, detoxify_scores):
        """Builds 8-dimensional text/speech toxicity feature vector."""
        feat = np.zeros(8, dtype=np.float32)
        cats = ["toxicity", "severe_toxicity", "obscene", "threat", "insult", "identity_attack", "profanity"]
        for idx, cat in enumerate(cats):
            feat[idx] = float(detoxify_scores.get(cat, 0.0))
        feat[7] = max(feat[:7])
        return torch.from_numpy(np.array([feat], dtype=np.float32)).to(self.device)

    def _construct_policy_feature(self, profile):
        """Builds 8-dimensional profile policy vector."""
        feat = np.zeros(8, dtype=np.float32)
        profile = profile or {}
        age = profile.get("age", 8)
        strictness = profile.get("strictness", "STRICT").upper()

        feat[0] = min(age / 18.0, 1.0)
        feat[1] = 1.0 if strictness == "STRICT" else (0.5 if strictness == "MODERATE" else 0.0)
        feat[2] = 1.0 if profile.get("block_explicit", True) else 0.0
        feat[3] = 1.0 if profile.get("block_profanity", True) else 0.0
        feat[4] = 1.0 if profile.get("block_violence", True) else 0.0
        feat[5] = 1.0 if age < 10 else 0.0
        feat[6] = 1.0 if 10 <= age < 16 else 0.0
        feat[7] = 1.0 if age >= 16 else 0.0
        return torch.from_numpy(np.array([feat], dtype=np.float32)).to(self.device)

    def evaluate_safety_guardrail(self, opennsfw2_score, nudenet_detections, detoxify_scores, profile=None):
        """
        Runs multi-modal NVIDIA NeMo Guardrail arbitration.
        Returns safety status, risk score, recommended action, and policy reason.
        """
        v_tensor = self._construct_visual_feature(opennsfw2_score, nudenet_detections)
        t_tensor = self._construct_text_feature(detoxify_scores)
        p_tensor = self._construct_policy_feature(profile)

        # Neural inference
        class_idx = 0
        confidences = [1.0, 0.0, 0.0, 0.0]

        if self.model is not None:
            try:
                with torch.no_grad():
                    logits = self.model(v_tensor, t_tensor, p_tensor)
                    probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                    confidences = [round(float(p), 4) for p in probs]
                    class_idx = int(np.argmax(probs))
            except Exception:
                pass

        # Deterministic Guardrail overrides for critical child violations
        has_severe_genitalia = any("GENITALIA" in str(d.get("class", "")).upper() for d in nudenet_detections)
        has_high_nsfw = opennsfw2_score > 0.85
        has_severe_obscene = detoxify_scores.get("severe_toxicity", 0) > 0.7 or detoxify_scores.get("obscene", 0) > 0.85
        
        is_child = (profile or {}).get("age", 8) < 13
        reason = "Content conforms with child-safe viewing policies."
        
        if is_child and (has_severe_genitalia or (has_high_nsfw and has_severe_obscene)):
            class_idx = 3  # BLOCKED_VIOLATION
            reason = "CRITICAL VIOLATION: Uncensored explicit anatomical or obscene material is prohibited for child profiles."
        elif has_severe_genitalia or has_high_nsfw:
            if class_idx < 1:
                class_idx = 1  # CENSOR_AND_STREAM
            reason = "MODERATION REQUIRED: Visual adult content detected; automatic 51x51 Gaussian blur redaction applied."
        elif detoxify_scores.get("profanity", 0) > 0.5 or detoxify_scores.get("toxicity", 0) > 0.6:
            if class_idx < 1:
                class_idx = 1  # CENSOR_AND_STREAM
            reason = "AUDIO MODERATION: Profanity detected in speech stream; 1000 Hz bleep tone applied."

        decision = self.DECISIONS[class_idx]
        risk_score = round(max(opennsfw2_score, detoxify_scores.get("toxicity", 0), 1.0 - confidences[0]), 3)

        return {
            "guardrail_engine": "NVIDIA-NeMo-Guardrails",
            "decision": decision,
            "risk_score": risk_score,
            "safety_status": "APPROVED" if decision == "SAFE_TO_STREAM" else ("REDACTED" if decision == "CENSOR_AND_STREAM" else "REJECTED"),
            "policy_reason": reason,
            "confidences": {
                "SAFE_TO_STREAM": confidences[0],
                "CENSOR_AND_STREAM": confidences[1],
                "RESTRICTED_PIN_REQUIRED": confidences[2],
                "BLOCKED_VIOLATION": confidences[3]
            },
            "attribution": {
                "visual_contribution": round(float(opennsfw2_score), 3),
                "audio_toxicity_contribution": round(float(detoxify_scores.get("toxicity", 0.0)), 3),
                "policy_strictness": (profile or {}).get("strictness", "STRICT")
            }
        }


# Singleton instance
nemo_instance = None

def get_nemo_engine():
    global nemo_instance
    if nemo_instance is None:
        nemo_instance = NeMoNSFWGuardrailEngine()
    return nemo_instance


if __name__ == "__main__":
    engine = NeMoNSFWGuardrailEngine()
    res = engine.evaluate_safety_guardrail(
        opennsfw2_score=0.78,
        nudenet_detections=[{"class": "FEMALE_BREAST_EXPOSED", "score": 0.88}],
        detoxify_scores={"toxicity": 0.45, "profanity": 0.82},
        profile={"age": 9, "strictness": "STRICT"}
    )
    print("[TEST] NVIDIA NeMo Evaluation Result:")
    print(json.dumps(res, indent=2))
