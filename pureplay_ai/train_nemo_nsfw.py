"""
PurePlay AI — NVIDIA NeMo Multi-Modal NSFW & Safety Guardrail Training Pipeline
Trains a cross-modal neural guardrail fusion head that arbitrates visual NSFW,
speech toxicity, and parental policies into definitive moderation decisions.
Exports 'pureplay_nemo_trained.pt' and 'pureplay_nemo_trained.onnx'.
"""

import os
import sys
import json
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from nemo_nsfw_engine import NeMoCrossModalSafetyHead, NeMoNSFWGuardrailEngine


class MultiModalSafetyDataset(Dataset):
    """
    Synthesizes aligned multi-modal safety benchmarks:
    (Visual NSFW Vector [16], Text Toxicity Vector [8], Policy Vector [8]) -> Target Class [0..3]
    """
    def __init__(self, num_samples=320):
        self.samples = []
        
        for i in range(num_samples):
            # Deterministic distribution across 4 scenarios
            scenario = i % 4
            
            visual = np.random.uniform(0.0, 0.2, 16).astype(np.float32)
            text = np.random.uniform(0.0, 0.2, 8).astype(np.float32)
            policy = np.zeros(8, dtype=np.float32)
            
            # Policy features
            is_child = (i % 2 == 0)
            policy[0] = 0.4 if is_child else 0.9  # Age normalized
            policy[1] = 1.0  # Strict mode
            policy[5] = 1.0 if is_child else 0.0

            if scenario == 0:
                # SAFE_TO_STREAM
                label = 0
            elif scenario == 1:
                # CENSOR_AND_STREAM (Moderate nudity or profanity)
                visual[0] = np.random.uniform(0.5, 0.75)
                visual[2] = np.random.uniform(0.6, 0.8) # Breast / partial
                text[6] = np.random.uniform(0.5, 0.8)   # Profanity
                label = 1
            elif scenario == 2:
                # RESTRICTED_PIN_REQUIRED (Teen content or high toxicity on mature profile)
                visual[0] = np.random.uniform(0.7, 0.85)
                text[0] = np.random.uniform(0.7, 0.85)
                policy[0] = 0.85  # Teen / Mature
                label = 2
            else:
                # BLOCKED_VIOLATION (Severe explicit or violent for children)
                visual[0] = np.random.uniform(0.9, 1.0)
                visual[1] = np.random.uniform(0.85, 1.0) # Genitalia
                text[0] = np.random.uniform(0.85, 1.0)
                text[1] = np.random.uniform(0.7, 0.95)   # Severe toxicity
                label = 3 if is_child else 2

            self.samples.append((
                torch.tensor(visual, dtype=torch.float32),
                torch.tensor(text, dtype=torch.float32),
                torch.tensor(policy, dtype=torch.float32),
                torch.tensor(label, dtype=torch.long)
            ))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        return self.samples[idx]


def train_nemo_nsfw(epochs=5, batch_size=16, lr=0.001, export_onnx=True, output_dir=None):
    if output_dir is None:
        output_dir = os.path.dirname(__file__)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("\n==========================================")
    print(f"[START] Training NVIDIA NeMo Multi-Modal Guardrail on {device}")
    print("==========================================")

    dataset = MultiModalSafetyDataset(num_samples=320)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_data, val_data = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False)

    model = NeMoCrossModalSafetyHead().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)

    start_time = time.time()
    best_acc = 0.0
    history = []

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for visual, text, policy, labels in train_loader:
            visual, text, policy, labels = visual.to(device), text.to(device), policy.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(visual, text, policy)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * visual.size(0)
            _, preds = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (preds == labels).sum().item()

        epoch_loss = running_loss / total
        epoch_acc = (correct / total) * 100

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for visual, text, policy, labels in val_loader:
                visual, text, policy, labels = visual.to(device), text.to(device), policy.to(device), labels.to(device)
                outputs = model(visual, text, policy)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * visual.size(0)
                _, preds = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (preds == labels).sum().item()

                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        val_loss = val_loss / val_total
        val_acc = (val_correct / val_total) * 100

        history.append({
            "epoch": epoch,
            "train_loss": round(epoch_loss, 4),
            "train_acc": round(epoch_acc, 2),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 2)
        })

        print(f"Epoch [{epoch}/{epochs}] — Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:.1f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.1f}%")

        if val_acc > best_acc or epoch == epochs:
            best_acc = val_acc
            pt_path = os.path.join(output_dir, "pureplay_nemo_trained.pt")
            torch.save({
                "model_state_dict": model.state_dict(),
                "decisions": NeMoNSFWGuardrailEngine.DECISIONS,
                "best_acc": best_acc,
                "epochs": epochs
            }, pt_path)

    total_time = time.time() - start_time
    print(f"\n[DONE] NVIDIA NeMo Training Complete in {total_time:.1f}s! Best Val Acc: {best_acc:.1f}%")

    # Export to ONNX
    onnx_path = os.path.join(output_dir, "pureplay_nemo_trained.onnx")
    if export_onnx:
        try:
            model.eval()
            d_v = torch.randn(1, 16, device=device)
            d_t = torch.randn(1, 8, device=device)
            d_p = torch.randn(1, 8, device=device)
            torch.onnx.export(
                model,
                (d_v, d_t, d_p),
                onnx_path,
                opset_version=18,
                input_names=["visual_features", "text_features", "policy_features"],
                output_names=["decision_logits"],
                dynamic_axes={
                    "visual_features": {0: "batch_size"},
                    "text_features": {0: "batch_size"},
                    "policy_features": {0: "batch_size"},
                    "decision_logits": {0: "batch_size"}
                }
            )
            print(f"[EXPORT] Exported NVIDIA NeMo Model to ONNX: {onnx_path}")
        except Exception as e:
            print(f"[WARN] ONNX export warning: {e}")

    metrics = {
        "model": "NVIDIA-NeMo-Guardrails",
        "epochs": epochs,
        "best_accuracy": best_acc,
        "training_time_sec": round(total_time, 2),
        "decisions": NeMoNSFWGuardrailEngine.DECISIONS,
        "history": history,
        "pt_path": pt_path,
        "onnx_path": onnx_path if os.path.exists(onnx_path) else None
    }

    with open(os.path.join(output_dir, "nemo_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    args = parser.parse_args()
    train_nemo_nsfw(epochs=args.epochs, batch_size=args.batch_size)
