"""
PurePlay — NudeNet Model Training & Fine-Tuning Pipeline
Architecture: Transfer Learning Object Detection & Classification with PyTorch & ONNX Export

This script allows you to fine-tune or train an adult/NSFW content detector
on custom datasets and exports the final model to ONNX format for use in
the PurePlay NudeNet censorship engine.
"""

import os
import sys
import argparse
import time
import json

# Ensure Windows stdout supports unicode logging without encoding crashes
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image

# Default PurePlay Classes
TARGET_CLASSES = [
    "SAFE",
    "FEMALE_GENITALIA_EXPOSED",
    "FEMALE_BREAST_EXPOSED",
    "BUTTOCKS_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
]

NUM_CLASSES = len(TARGET_CLASSES)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Dataset Loader
# ═══════════════════════════════════════════════════════════════════════════════

class PurePlayNSFWDataset(Dataset):
    """
    Dataset loader for NSFW image classification and region detection.
    Expects directory structure:
      data_dir/
        train/ (or val/)
          SAFE/
          FEMALE_GENITALIA_EXPOSED/
          FEMALE_BREAST_EXPOSED/
          ...
    Or a manifest.json / annotations.csv file mapping images to labels.
    """
    def __init__(self, root_dir, split="train", transform=None):
        self.root_dir = os.path.join(root_dir, split)
        self.transform = transform
        self.samples = []

        if os.path.exists(self.root_dir):
            for class_idx, class_name in enumerate(TARGET_CLASSES):
                class_folder = os.path.join(self.root_dir, class_name)
                if os.path.isdir(class_folder):
                    for fname in os.listdir(class_folder):
                        if fname.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                            self.samples.append((os.path.join(class_folder, fname), class_idx))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(label, dtype=torch.long)


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Model Architecture: Transfer Learning with MobileNetV3 / ResNet Backbone
# ═══════════════════════════════════════════════════════════════════════════════

class PurePlayNudeNetModel(nn.Module):
    """
    Transfer learning network based on MobileNetV3-Small / ResNet.
    Pre-trained on ImageNet, fine-tuned for high-speed edge NSFW classification.
    """
    def __init__(self, num_classes=NUM_CLASSES, pretrained=True):
        super(PurePlayNudeNetModel, self).__init__()
        # MobileNetV3-Small is lightweight and optimal for real-time video frame processing
        backbone = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None)
        in_features = backbone.classifier[0].in_features
        backbone.classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(256, num_classes),
        )
        self.model = backbone

    def forward(self, x):
        return self.model(x)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Training and Evaluation Loops
# ═══════════════════════════════════════════════════════════════════════════════

def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    epoch_loss = running_loss / max(total, 1)
    epoch_acc = correct / max(total, 1)
    return epoch_loss, epoch_acc


def validate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.cpu().numpy())

    val_loss = running_loss / max(total, 1)
    val_acc = correct / max(total, 1)
    return val_loss, val_acc, all_preds, all_targets


def export_to_onnx(model, save_path="pureplay_nudenet.onnx", input_size=320, device="cpu"):
    """
    Exports trained PyTorch weights to standard ONNX graph.
    The ONNX format enables hardware-accelerated inference in NudeNet & onnxruntime.
    """
    model.eval()
    dummy_input = torch.randn(1, 3, input_size, input_size, device=device)
    print(f"[*] Exporting model to ONNX: {save_path}...")
    try:
        torch.onnx.export(
            model,
            dummy_input,
            save_path,
            export_params=True,
            opset_version=18,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        )
        print(f"[+] ONNX export successful: {save_path} ({os.path.getsize(save_path) / 1024:.1f} KB)")
    except Exception as e:
        print(f"[!] Warning: ONNX export encountered error: {e}. PyTorch checkpoint was saved successfully.")


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Main Training Pipeline
# ═══════════════════════════════════════════════════════════════════════════════

def train_nudenet(epochs=5, batch_size=16, lr=1e-3, img_size=320, data_dir=None, export_onnx=True, output_dir=None):
    if output_dir is None:
        output_dir = os.path.dirname(__file__)
    if data_dir is None:
        data_dir = os.path.join(output_dir, "data")
        
    output_model = os.path.join(output_dir, "pureplay_nudenet_trained.pt")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] PurePlay AI Training Pipeline initialized on device: {device}")
    print(f"[*] Target Classes ({NUM_CLASSES}): {TARGET_CLASSES}")

    # Data Augmentation Transforms
    train_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    train_dataset = PurePlayNSFWDataset(data_dir, split="train", transform=train_transform)
    val_dataset = PurePlayNSFWDataset(data_dir, split="val", transform=val_transform)

    if len(train_dataset) == 0:
        print("[!] No images found in dataset directory. Creating a quick synthetic dataset for verification...")
        from generate_dummy_dataset import generate_synthetic_data
        generate_synthetic_data(data_dir)
        train_dataset = PurePlayNSFWDataset(data_dir, split="train", transform=train_transform)
        val_dataset = PurePlayNSFWDataset(data_dir, split="val", transform=val_transform)

    print(f"[*] Training dataset size: {len(train_dataset)} samples")
    print(f"[*] Validation dataset size: {len(val_dataset)} samples")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # Instantiate Model
    model = PurePlayNudeNetModel(num_classes=NUM_CLASSES, pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    print("\n" + "=" * 60)
    print(f" STARTING TRAINING — {epochs} EPOCHS")
    print("=" * 60)

    start_time = time.time()
    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        t_loss, t_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        v_loss, v_acc, preds, targets = validate(model, val_loader, criterion, device)
        scheduler.step()

        elapsed = time.time() - epoch_start
        history["train_loss"].append(round(t_loss, 4))
        history["train_acc"].append(round(t_acc, 4))
        history["val_loss"].append(round(v_loss, 4))
        history["val_acc"].append(round(v_acc, 4))

        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({elapsed:.1f}s) | "
              f"Train Loss: {t_loss:.4f} - Acc: {t_acc*100:.1f}% | "
              f"Val Loss: {v_loss:.4f} - Acc: {v_acc*100:.1f}%")

        if v_acc >= best_acc:
            best_acc = v_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "classes": TARGET_CLASSES,
                "best_acc": best_acc,
            }, output_model)

    total_time = time.time() - start_time
    print("=" * 60)
    print(f"[+] Training completed in {total_time:.1f}s! Best Val Accuracy: {best_acc*100:.2f}%")
    print(f"[+] Checkpoint saved to: {output_model}")

    # Export to ONNX for NudeNet Engine
    onnx_file = output_model.replace(".pt", ".onnx")
    if export_onnx:
        export_to_onnx(model.to("cpu"), save_path=onnx_file, input_size=img_size, device="cpu")

    metrics = {
        "model": "NudeNet-320n",
        "epochs": epochs,
        "best_accuracy": round(best_acc * 100, 2),
        "training_time_sec": round(total_time, 2),
        "history": history,
        "pt_path": output_model,
        "onnx_path": onnx_file if os.path.exists(onnx_file) else None
    }

    metrics_path = os.path.join(output_dir, "training_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


def main():
    parser = argparse.ArgumentParser(description="PurePlay NudeNet Fine-Tuning Pipeline")
    parser.add_argument("--data-dir", type=str, default="./data", help="Root directory of dataset")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--img-size", type=int, default=320, help="Input frame dimension")
    parser.add_argument("--export-onnx", action="store_true", default=True, help="Export to ONNX after training")
    args = parser.parse_args()

    train_nudenet(
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        img_size=args.img_size,
        data_dir=args.data_dir,
        export_onnx=args.export_onnx
    )


if __name__ == "__main__":
    main()
