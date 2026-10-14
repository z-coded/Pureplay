"""
PurePlay AI — Detoxify Multi-Label NLP Toxicity Classifier Training Pipeline
Trains a neural multi-label classification head for child safety text moderation across 7 categories:
toxicity, severe_toxicity, obscene, threat, insult, identity_attack, profanity.
Saves PyTorch weights 'pureplay_detoxify_trained.pt' and exports 'pureplay_detoxify_trained.onnx'.
"""

import os
import sys
import json
import time
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from detoxify_engine import PurePlayToxicClassifier, DetoxifyEngine


class ChildSafetyTextDataset(Dataset):
    """
    Child-safety moderation dataset pairing labeled phrases with 7-class multi-label targets.
    [toxicity, severe_toxicity, obscene, threat, insult, identity_attack, profanity]
    """
    def __init__(self, num_samples=200, max_len=64):
        self.samples = []
        self.max_len = max_len
        
        labeled_corpus = [
            # Safe samples (all 0s)
            ("Welcome to our family game stream today guys!", [0, 0, 0, 0, 0, 0, 0]),
            ("Make sure to finish your math and science homework.", [0, 0, 0, 0, 0, 0, 0]),
            ("Good morning everyone hope you have an awesome creative day.", [0, 0, 0, 0, 0, 0, 0]),
            ("Can you help me build this Lego castle in Minecraft?", [0, 0, 0, 0, 0, 0, 0]),
            ("Let's watch the cartoon adventure episode together.", [0, 0, 0, 0, 0, 0, 0]),
            ("Please be kind to your classmates and share your toys.", [0, 0, 0, 0, 0, 0, 0]),
            
            # Profanity / mild toxicity
            ("Damn it that level was so annoying and crap.", [1, 0, 0, 0, 0, 0, 1]),
            ("What the hell is wrong with this dumb game server.", [1, 0, 0, 0, 0, 0, 1]),
            ("Shut up you stupid idiot nobody asked you.", [1, 0, 0, 0, 1, 0, 0]),
            ("You are the worst player ever get lost loser.", [1, 0, 0, 0, 1, 0, 0]),
            
            # Obscene & Severe
            ("This is absolute disgusting shit and obscene garbage.", [1, 0, 1, 0, 0, 0, 1]),
            ("Fuck off and stop talking to me right now.", [1, 1, 1, 0, 1, 0, 1]),
            ("I will kill you and murder your entire team.", [1, 1, 0, 1, 0, 0, 0]),
            ("I hate all of you people go die in a hole.", [1, 1, 0, 1, 1, 1, 0]),
            ("Watch this adult porn and explicit content.", [1, 0, 1, 0, 0, 0, 0]),
            ("Get out of here before I beat you up.", [1, 0, 0, 1, 0, 0, 0])
        ]

        # Expand to num_samples with variations
        for i in range(num_samples):
            text, labels = labeled_corpus[i % len(labeled_corpus)]
            tokens = self._tokenize(text)
            self.samples.append((tokens, torch.tensor(labels, dtype=torch.float32)))

    def _tokenize(self, text):
        words = re.findall(r'\b\w+\b', text.lower())
        tokens = [((hash(w) % 4998) + 1) for w in words][:self.max_len]
        if len(tokens) < self.max_len:
            tokens += [0] * (self.max_len - len(tokens))
        return torch.tensor(tokens, dtype=torch.long)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        return self.samples[idx]


def train_detoxify(epochs=5, batch_size=16, lr=0.002, export_onnx=True, output_dir=None):
    if output_dir is None:
        output_dir = os.path.dirname(__file__)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("\n==========================================")
    print(f"[START] Training Detoxify 7-Class NLP Classifier on {device}")
    print("==========================================")

    dataset = ChildSafetyTextDataset(num_samples=240)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_data, val_data = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False)

    model = PurePlayToxicClassifier().to(device)
    criterion = nn.BCELoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)

    start_time = time.time()
    best_f1 = 0.0
    history = []

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        total_batches = 0

        for tokens, targets in train_loader:
            tokens, targets = tokens.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(tokens)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            total_batches += 1

        train_loss = running_loss / max(total_batches, 1)

        # Validation
        model.eval()
        val_loss = 0.0
        val_batches = 0
        all_preds = []
        all_targets = []

        with torch.no_grad():
            for tokens, targets in val_loader:
                tokens, targets = tokens.to(device), targets.to(device)
                outputs = model(tokens)
                loss = criterion(outputs, targets)
                val_loss += loss.item()
                val_batches += 1

                preds_binary = (outputs > 0.5).float()
                all_preds.extend(preds_binary.cpu().numpy())
                all_targets.extend(targets.cpu().numpy())

        val_loss = val_loss / max(val_batches, 1)
        all_preds = np.array(all_preds)
        all_targets = np.array(all_targets)

        # Macro F1 across 7 classes
        tp = np.sum((all_preds == 1) & (all_targets == 1))
        fp = np.sum((all_preds == 1) & (all_targets == 0))
        fn = np.sum((all_preds == 0) & (all_targets == 1))
        precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 1.0
        accuracy = np.mean(all_preds == all_targets) * 100

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "accuracy": round(float(accuracy), 2),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4)
        })

        print(f"Epoch [{epoch}/{epochs}] — Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Acc: {accuracy:.1f}% | Precision: {precision:.3f} | Recall: {recall:.3f} | F1: {f1:.3f}")

        if f1 > best_f1 or epoch == epochs:
            best_f1 = f1
            pt_path = os.path.join(output_dir, "pureplay_detoxify_trained.pt")
            torch.save({
                "model_state_dict": model.state_dict(),
                "classes": DetoxifyEngine.CLASSES,
                "best_f1": best_f1,
                "epochs": epochs
            }, pt_path)

    total_time = time.time() - start_time
    print(f"\n[DONE] Detoxify Training Complete in {total_time:.1f}s! Best F1 Score: {best_f1:.3f}")

    # Export to ONNX
    onnx_path = os.path.join(output_dir, "pureplay_detoxify_trained.onnx")
    if export_onnx:
        try:
            model.eval()
            dummy_input = torch.randint(0, 5000, (1, 64), dtype=torch.long, device=device)
            torch.onnx.export(
                model,
                dummy_input,
                onnx_path,
                opset_version=18,
                input_names=["token_ids"],
                output_names=["toxicity_probabilities"],
                dynamic_axes={"token_ids": {0: "batch_size"}}
            )
            print(f"[EXPORT] Exported Detoxify Model to ONNX: {onnx_path}")
        except Exception as e:
            print(f"[WARN] ONNX export warning: {e}")

    metrics = {
        "model": "Detoxify-MultiLabel",
        "epochs": epochs,
        "best_f1_score": round(best_f1, 4),
        "validation_accuracy": history[-1]["accuracy"],
        "training_time_sec": round(total_time, 2),
        "classes": DetoxifyEngine.CLASSES,
        "history": history,
        "pt_path": pt_path,
        "onnx_path": onnx_path if os.path.exists(onnx_path) else None
    }

    with open(os.path.join(output_dir, "detoxify_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    args = parser.parse_args()
    train_detoxify(epochs=args.epochs, batch_size=args.batch_size)
