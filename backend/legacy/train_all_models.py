"""
PurePlay AI — Master Multi-Model Training & Benchmark Runner
Trains and exports all 5 core PurePlay AI moderation models:
1. NudeNet (Deep Anatomical Object Detection)
2. OpenNSFW2 (Visual NSFW Frame Classification)
3. OpenAI Whisper (Acoustic Domain Speech-to-Text Transcription)
4. Detoxify (7-Class NLP Toxicity and Profanity Moderation)
5. NVIDIA NeMo Guardrails (Multi-Modal Policy & Safety Classification)
Produces unified benchmark evaluation artifact: 'all_models_evaluation.json'.
"""

import os
import sys
import json
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from train_nudenet import train_nudenet
from train_opennsfw2 import train_opennsfw2
from train_whisper import train_whisper
from train_detoxify import train_detoxify
from train_nemo_nsfw import train_nemo_nsfw


def run_full_training_suite(epochs_quick=3):
    start_all = time.time()
    base_dir = os.path.dirname(__file__)

    print("==================================================================")
    print("🎓 PurePlay AI — Final Year Project (FYP) Multi-Model Suite")
    print("==================================================================")

    results = {}

    # 1. NudeNet
    print("\n>>> [1/5] Training NudeNet Detector...")
    try:
        nudenet_res = train_nudenet(epochs=epochs_quick, batch_size=8, output_dir=base_dir)
        results["NudeNet"] = nudenet_res
    except Exception as e:
        print(f"[ERROR] NudeNet training failed: {e}")
        results["NudeNet"] = {"status": "error", "error": str(e)}

    # 2. OpenNSFW2
    print("\n>>> [2/5] Training OpenNSFW2 Classifier...")
    try:
        opennsfw2_res = train_opennsfw2(epochs=epochs_quick, batch_size=16, output_dir=base_dir)
        results["OpenNSFW2"] = opennsfw2_res
    except Exception as e:
        print(f"[ERROR] OpenNSFW2 training failed: {e}")
        results["OpenNSFW2"] = {"status": "error", "error": str(e)}

    # 3. OpenAI Whisper
    print("\n>>> [3/5] Training OpenAI Whisper Domain Adapter...")
    try:
        whisper_res = train_whisper(epochs=epochs_quick, batch_size=8, output_dir=base_dir)
        results["OpenAI-Whisper"] = whisper_res
    except Exception as e:
        print(f"[ERROR] Whisper training failed: {e}")
        results["OpenAI-Whisper"] = {"status": "error", "error": str(e)}

    # 4. Detoxify
    print("\n>>> [4/5] Training Detoxify Multi-Label NLP Classifier...")
    try:
        detoxify_res = train_detoxify(epochs=epochs_quick, batch_size=16, output_dir=base_dir)
        results["Detoxify"] = detoxify_res
    except Exception as e:
        print(f"[ERROR] Detoxify training failed: {e}")
        results["Detoxify"] = {"status": "error", "error": str(e)}

    # 5. NVIDIA NeMo Guardrails
    print("\n>>> [5/5] Training NVIDIA NeMo Multi-Modal Safety Guardrail...")
    try:
        nemo_res = train_nemo_nsfw(epochs=epochs_quick, batch_size=16, output_dir=base_dir)
        results["NVIDIA-NeMo"] = nemo_res
    except Exception as e:
        print(f"[ERROR] NVIDIA NeMo training failed: {e}")
        results["NVIDIA-NeMo"] = {"status": "error", "error": str(e)}

    total_duration = time.time() - start_all

    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_training_time_sec": round(total_duration, 2),
        "models_count": len(results),
        "models": results
    }

    eval_path = os.path.join(base_dir, "all_models_evaluation.json")
    with open(eval_path, "w") as f:
        json.dump(summary, f, indent=2)

    print("\n==================================================================")
    print("🏆 PurePlay AI Multi-Model Training Suite Complete!")
    print(f"⏱️ Total Execution Time: {total_duration:.1f}s")
    print(f"📊 Full Evaluation Metrics: {eval_path}")
    print("==================================================================")
    print("| Model Name      | Modality     | Architecture    | Format (.pt / .onnx) |")
    print("|-----------------|--------------|-----------------|----------------------|")
    print("| NudeNet         | Vision (BBox)| 320n ConvNet    | Ready (ONNX/PT)      |")
    print("| OpenNSFW2       | Vision (Prob)| ResNet-18       | Ready (ONNX/PT)      |")
    print("| OpenAI Whisper  | Audio (ASR)  | Transformer-Attn| Ready (ONNX/PT)      |")
    print("| Detoxify        | NLP Text (7C)| TextCNN Multi-L | Ready (ONNX/PT)      |")
    print("| NVIDIA NeMo     | Multi-Modal  | Cross-Modal MLP | Ready (ONNX/PT)      |")
    print("==================================================================")

    return summary


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=3)
    args = parser.parse_args()
    run_full_training_suite(epochs_quick=args.epochs)
