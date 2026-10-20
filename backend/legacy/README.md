# PurePlay AI — Multi-Modal Child-Safe Media Moderation Engine

This directory contains the AI processing backend for **PurePlay: An AI-Powered Video Filtering System for Child-Safe Media Consumption** (COMSATS University Islamabad).

It implements, trains, and exposes all 5 AI models and the media processing engine specified in the PurePlay Software Design Specification (SDS):
1. **NudeNet** (Deep Anatomical Object Detection)
2. **OpenNSFW2** (Visual NSFW Probability Scoring)
3. **OpenAI Whisper** (Acoustic Domain Speech-to-Text Transcription)
4. **Detoxify** (7-Class NLP Toxicity & Profanity Moderation)
5. **NVIDIA NeMo Guardrails** (Multi-Modal Policy & Safety Classification)
6. **OpenCV & Media Processor** (51×51 Gaussian Blur Visual Redaction & 1000 Hz Audio Bleep Tone Synthesis)

---

## 📁 Repository Structure

```
backend/legacy/
├── opennsfw2_engine.py         # OpenNSFW2 ResNet-18 visual frame classifier
├── whisper_engine.py           # OpenAI Whisper speech-to-text with timestamp intervals
├── detoxify_engine.py          # Detoxify 7-class NLP toxicity & profanity engine
├── nemo_nsfw_engine.py         # NVIDIA NeMo Multi-Modal Guardrails cross-modal engine
├── media_processor.py          # OpenCV 51x51 blur redaction & 1000 Hz audio bleep synth
├── nudenet_engine.py           # NudeNet anatomical frame analyzer & video redactor
├── server.py                   # FastAPI microservice (http://127.0.0.1:8000)
├── cli.py                      # Command-line inspection tool
├── train_all_models.py         # Master training runner across all 5 models
├── train_nudenet.py            # NudeNet fine-tuning pipeline & ONNX export
├── train_opennsfw2.py          # OpenNSFW2 ResNet transfer learning pipeline
├── train_whisper.py            # OpenAI Whisper acoustic domain adaptation pipeline
├── train_detoxify.py           # Detoxify 7-class NLP classifier training pipeline
├── train_nemo_nsfw.py          # NVIDIA NeMo multi-modal guardrail training pipeline
├── test_all_engines.py         # Full 6-component integration & verification test suite
├── all_models_evaluation.json  # Unified benchmark evaluation metrics
├── pureplay_nudenet_trained.*  # PyTorch (.pt) and ONNX (.onnx) checkpoints
├── pureplay_opennsfw2_trained.*# PyTorch (.pt) and ONNX (.onnx) checkpoints
├── pureplay_whisper_trained.*  # PyTorch (.pt) and ONNX (.onnx) checkpoints
├── pureplay_detoxify_trained.* # PyTorch (.pt) and ONNX (.onnx) checkpoints
└── pureplay_nemo_trained.*     # PyTorch (.pt) and ONNX (.onnx) checkpoints
```

---

## 🚀 1. Quick Start & Verification

### Run Integration Tests (All 6 Engines):
```bash
cd "D:\fyp\FYP-1 PROJECT\backend\legacy"
python test_all_engines.py
```

### Train All 5 Models in One Command:
```bash
python train_all_models.py --epochs 3
```

### Start the AI Microservice:
```bash
python server.py
```
The server runs on **`http://127.0.0.1:8000`** with interactive Swagger documentation at **`http://127.0.0.1:8000/docs`**.

---

## 🧠 2. Model Specifications & Training Pipelines

| Model Name | Modality | Architecture | Input | Output Classes / Format | Checkpoint Files |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NudeNet** | Vision (BBox) | 320n ConvNet | Frames (320×320) | 5 Anatomical Classes (`SAFE`, `FEMALE_GENITALIA`, `FEMALE_BREAST`, etc.) | `pureplay_nudenet_trained.pt`<br>`pureplay_nudenet_trained.onnx` |
| **OpenNSFW2** | Vision (Prob) | ResNet-18 | Frames (224×224) | Adult Probability (0.0 to 1.0) | `pureplay_opennsfw2_trained.pt`<br>`pureplay_opennsfw2_trained.onnx` |
| **OpenAI Whisper** | Audio (ASR) | Transformer Multi-Head | Log-Mel Spectrogram (80×T) | Transcripts with timestamped segments & words | `pureplay_whisper_trained.pt`<br>`pureplay_whisper_trained.onnx` |
| **Detoxify** | NLP Text | Multi-Filter TextCNN | Token IDs (64) | 7 Multi-Label Classes (`toxicity`, `severe_toxicity`, `obscene`, `threat`, `insult`, `identity_attack`, `profanity`) | `pureplay_detoxify_trained.pt`<br>`pureplay_detoxify_trained.onnx` |
| **NVIDIA NeMo** | Multi-Modal | Cross-Modal Fusion MLP | Visual (16D) + Audio/Text (8D) + Policy (8D) | 4 Policy Actions (`SAFE_TO_STREAM`, `CENSOR_AND_STREAM`, `RESTRICTED_PIN_REQUIRED`, `BLOCKED_VIOLATION`) | `pureplay_nemo_trained.pt`<br>`pureplay_nemo_trained.onnx` |

---

## 🛠️ 3. Media Processing Pipeline (OpenCV & FFmpeg)

Implemented in [`media_processor.py`](media_processor.py):
- **Keyframe Extraction**: High-throughput video frame sampling at configurable FPS via OpenCV `cv2.VideoCapture`.
- **Visual Censorship**: Applies a 51×51 Gaussian blur kernel (`cv2.GaussianBlur`) with child-safety boundary highlighting over detected explicit anatomical regions.
- **Audio Censorship**: Pure-Python 1000 Hz sine wave tone generator (`struct.pack` WAV synthesis) replaces audio tracks at profanity intervals flagged by Detoxify and Whisper.
- **Sanitized Video Rendering**: Reassembles sanitized frames into a child-safe streaming video (`cv2.VideoWriter`).

---

## 🌐 4. Microservice API Endpoints

- `GET /api/health` — Microservice status and loaded model inventory.
- `GET /api/models/status` — Model existence, ONNX status, and evaluation metrics.
- `POST /api/analyze-video` — Full end-to-end multi-modal video analysis pipeline.
- `POST /api/analyze-image` — Visual image scan combining NudeNet + OpenNSFW2.
- `POST /api/detoxify/analyze` — 7-class text toxicity & profanity prediction.
- `POST /api/nemo/guardrail` — NVIDIA NeMo cross-modal child-safety policy decision.
- `POST /api/censor-video` — Returns sanitized video with 51×51 Gaussian blur applied.
