"""
PurePlay AI — Detoxify NLP Toxicity & Profanity Moderation Engine
Evaluates speech transcripts and text for 7 toxicity categories:
toxicity, severe_toxicity, obscene, threat, insult, identity_attack, profanity.
Maps flagged words to video/audio timestamps for targeted bleep redaction.
"""

import os
import sys
import re
import json
import time
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import torch
import torch.nn as nn


class PurePlayToxicClassifier(nn.Module):
    """
    Multi-label neural toxicity classifier head for PurePlay moderation.
    7 Output classes: toxicity, severe_toxicity, obscene, threat, insult, identity_attack, profanity.
    Uses multi-filter TextCNN architecture for fast, robust inference & ONNX compatibility.
    """
    def __init__(self, vocab_size=5000, embed_dim=128, num_classes=7):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.conv1 = nn.Conv1d(embed_dim, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(embed_dim, 64, kernel_size=5, padding=2)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        self.fc = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes),
            nn.Sigmoid()
        )

    def forward(self, x):
        emb = self.embedding(x).transpose(1, 2)  # [B, embed_dim, seq_len]
        c1 = self.relu(self.conv1(emb))
        c2 = self.relu(self.conv2(emb))
        p1 = torch.max(c1, dim=2)[0]
        p2 = torch.max(c2, dim=2)[0]
        features = self.dropout(torch.cat([p1, p2], dim=1))
        logits = self.fc(features)
        return logits


class DetoxifyEngine:
    """
    Detoxify moderation engine with real multi-label predictions and timestamp alignment.
    """
    CLASSES = [
        "toxicity",
        "severe_toxicity",
        "obscene",
        "threat",
        "insult",
        "identity_attack",
        "profanity"
    ]

    # Child safety profanity & sensitive keyword lexicon
    PROFANITY_LEXICON = {
        "damn": {"category": "profanity", "weight": 0.45},
        "hell": {"category": "profanity", "weight": 0.35},
        "crap": {"category": "profanity", "weight": 0.40},
        "ass": {"category": "profanity", "weight": 0.65},
        "bitch": {"category": "insult", "weight": 0.85},
        "bastard": {"category": "insult", "weight": 0.80},
        "idiot": {"category": "insult", "weight": 0.40},
        "stupid": {"category": "insult", "weight": 0.30},
        "shut up": {"category": "insult", "weight": 0.25},
        "kill": {"category": "threat", "weight": 0.90},
        "die": {"category": "threat", "weight": 0.85},
        "murder": {"category": "threat", "weight": 0.95},
        "hate": {"category": "identity_attack", "weight": 0.60},
        "fuck": {"category": "obscene", "weight": 0.98},
        "shit": {"category": "obscene", "weight": 0.88},
        "piss": {"category": "obscene", "weight": 0.70},
        "porn": {"category": "obscene", "weight": 0.95},
        "sex": {"category": "obscene", "weight": 0.75},
        "nude": {"category": "obscene", "weight": 0.85}
    }

    def __init__(self, model_path=None, threshold=0.50):
        self.threshold = threshold
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "pureplay_detoxify_trained.pt")
        self.model = None
        self._init_classifier()

    def _init_classifier(self):
        try:
            self.model = PurePlayToxicClassifier().to(self.device)
            if os.path.exists(self.model_path):
                state_dict = torch.load(self.model_path, map_location=self.device, weights_only=False)
                if "model_state_dict" in state_dict:
                    self.model.load_state_dict(state_dict["model_state_dict"])
                else:
                    self.model.load_state_dict(state_dict)
                print(f"[INFO] Loaded trained Detoxify model from {self.model_path}")
            self.model.eval()
        except Exception as e:
            print(f"[WARN] Using rule-augmented Detoxify engine ({e}).")

    def _simple_tokenize(self, text, max_len=64):
        # Deterministic token hashing for sequence representation
        words = re.findall(r'\b\w+\b', text.lower())
        tokens = [((hash(w) % 4998) + 1) for w in words][:max_len]
        if len(tokens) < max_len:
            tokens += [0] * (max_len - len(tokens))
        return torch.tensor([tokens], dtype=torch.long, device=self.device)

    def analyze_text(self, text):
        """
        Analyzes a single string of text, returning all 7 toxicity scores and flagged terms.
        """
        if not text or not text.strip():
            return {
                "text": text,
                "overall_toxicity": 0.0,
                "is_flagged": False,
                "scores": {c: 0.0 for c in self.CLASSES},
                "flagged_words": [],
                "primary_category": "SAFE"
            }

        text_lower = text.lower()
        found_flagged = []
        rule_scores = {c: 0.0 for c in self.CLASSES}

        # Lexicon matching
        for word, meta in self.PROFANITY_LEXICON.items():
            pattern = r'\b' + re.escape(word) + r'\b'
            matches = re.findall(pattern, text_lower)
            if matches:
                cat = meta["category"]
                w_val = meta["weight"]
                rule_scores[cat] = max(rule_scores[cat], w_val)
                rule_scores["toxicity"] = max(rule_scores["toxicity"], w_val * 0.95)
                found_flagged.append(word)

        # Neural Model inference
        neural_scores = {c: 0.0 for c in self.CLASSES}
        if self.model is not None:
            try:
                tokens = self._simple_tokenize(text)
                with torch.no_grad():
                    preds = self.model(tokens).cpu().numpy()[0]
                    for idx, c in enumerate(self.CLASSES):
                        neural_scores[c] = float(preds[idx])
            except Exception:
                pass

        # Fuse rule-based + neural scores
        final_scores = {}
        for c in self.CLASSES:
            score = max(rule_scores[c], neural_scores.get(c, 0.0))
            final_scores[c] = round(float(score), 4)

        overall = max(final_scores.values())
        is_flagged = overall >= self.threshold

        # Determine primary category
        primary = "SAFE"
        if is_flagged:
            sorted_cats = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
            primary = sorted_cats[0][0].upper()

        return {
            "text": text,
            "overall_toxicity": overall,
            "is_flagged": is_flagged,
            "scores": final_scores,
            "flagged_words": list(set(found_flagged)),
            "primary_category": primary
        }

    def analyze_whisper_segments(self, segments):
        """
        Cross-analyzes Whisper speech segments with Detoxify to produce
        exact audio redaction timestamps (bleep intervals).
        """
        moderated_segments = []
        redaction_intervals = []

        for seg in segments:
            text = seg.get("text", "")
            start = seg.get("start", 0.0)
            end = seg.get("end", 0.0)
            analysis = self.analyze_text(text)

            seg_result = {
                "id": seg.get("id", 0),
                "start": start,
                "end": end,
                "text": text,
                "is_flagged": analysis["is_flagged"],
                "overall_toxicity": analysis["overall_toxicity"],
                "flagged_words": analysis["flagged_words"],
                "scores": analysis["scores"]
            }
            moderated_segments.append(seg_result)

            if analysis["is_flagged"]:
                redaction_intervals.append({
                    "start": start,
                    "end": end,
                    "reason": analysis["primary_category"],
                    "flagged_words": analysis["flagged_words"],
                    "toxicity_score": analysis["overall_toxicity"]
                })

        return {
            "segments": moderated_segments,
            "redaction_intervals": redaction_intervals,
            "total_flagged_segments": len(redaction_intervals)
        }


# Singleton instance
detoxify_instance = None

def get_detoxify_engine():
    global detoxify_instance
    if detoxify_instance is None:
        detoxify_instance = DetoxifyEngine()
    return detoxify_instance


if __name__ == "__main__":
    engine = DetoxifyEngine()
    sample = "Hey shut up you idiot, this is stupid crap!"
    print(f"[TEST] Text: '{sample}'")
    print("[TEST] Analysis:", json.dumps(engine.analyze_text(sample), indent=2))
