# PurePlay — Product Requirements Document (PRD)

> **Classification:** Final Year Project (FYP-1) — University Academic Submission  
> **Document Version:** 2.0  
> **Last Updated:** October 2026  
> **Authors:** Development Team  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Problem Statement](#2-product-vision--problem-statement)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [User Roles & Personas](#5-user-roles--personas)
6. [Functional Requirements](#6-functional-requirements)
7. [AI Moderation Engine Specifications](#7-ai-moderation-engine-specifications)
8. [Data Architecture & Database Design](#8-data-architecture--database-design)
9. [API Specification](#9-api-specification)
10. [Frontend Module Breakdown](#10-frontend-module-breakdown)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [AI Model Training & Evaluation Metrics](#12-ai-model-training--evaluation-metrics)
13. [Security Requirements](#13-security-requirements)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Constraints & Known Limitations](#15-constraints--known-limitations)
16. [Glossary](#16-glossary)

---

## 1. Executive Summary

**PurePlay** is an AI-powered family video safety platform designed to protect children from age-inappropriate content in video media. The system automatically analyzes uploaded videos through a multi-modal AI pipeline, applies real-time censorship (visual Gaussian blur + audio bleep tones), and provides guardians with granular control over what their children can view.

The platform is a **Final Year Project (FYP-1)** and consists of two major subsystems:

| Subsystem | Location | Description |
|---|---|---|
| **PurePlay Frontend** | `FYP-1 PROJECT/pureplay/` | React SPA (Single-Page Application) |
| **PurePlay AI Microservice** | `pureplay_ai/` | FastAPI-based Python ML backend |

The system integrates **5 trained AI/ML models** running concurrently in a multi-modal fusion architecture to detect, censor, and classify video content for child safety compliance.

---

## 2. Product Vision & Problem Statement

### 2.1 Problem Statement

Digital streaming platforms expose children to age-inappropriate content daily — including sexual imagery, graphic violence, and profane audio — without adequate real-time safeguards. Existing parental controls rely on static category filters or manual reviews, leaving significant gaps in protection.

### 2.2 Solution

PurePlay creates an automated, real-time, **multi-modal content moderation pipeline** that:

- Detects exposed anatomy in video frames using computer vision (NudeNet ONNX)
- Scores adult content at the frame level using ResNet-18 (OpenNSFW2)
- Transcribes speech with timestamped precision (OpenAI Whisper)
- Classifies profanity and toxicity across 7 categories (Detoxify TextCNN)
- Fuses all signals into a final guardian policy decision (NVIDIA NeMo Guardrails)
- Renders a child-safe output video with blurred visuals and bleep-censored audio

### 2.3 Target Users

| User | Need |
|---|---|
| **Guardians / Parents** | Upload family videos, manage child profiles, enforce content policies |
| **Children** | Watch safe, pre-screened video content in restricted profile mode |
| **Platform Admins** | Moderate flagged content, manage user accounts, tune global AI thresholds |

---

## 3. System Architecture Overview

PurePlay employs a **decoupled microservice architecture** consisting of a stateless React frontend, a Python FastAPI AI microservice, and Firebase as the cloud BaaS (Backend-as-a-Service).

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                           │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │          React SPA (Vite + Tailwind CSS)            │   │
│   │  Landing · Login · Dashboard · Upload · Admin Panel  │   │
│   └────────────────┬───────────────────┬────────────────┘   │
│                    │                   │                     │
└────────────────────┼───────────────────┼─────────────────────┘
                     │ REST (XHR)        │ Firebase SDK
                     │                  │
         ┌───────────▼────────┐  ┌──────▼──────────────────┐
         │  PurePlay AI       │  │  Google Firebase         │
         │  Microservice      │  │  ─────────────────────── │
         │  FastAPI + Uvicorn │  │  • Auth (Email/Google)   │
         │  http://127.0.0.1  │  │  • Firestore (NoSQL DB)  │
         │  :8000             │  │  • Storage (Video Files) │
         │                    │  │  • Analytics             │
         │  ┌──────────────┐  │  └─────────────────────────┘
         │  │ NudeNet ONNX │  │
         │  │ OpenNSFW2    │  │
         │  │ Whisper ASR  │  │
         │  │ Detoxify NLP │  │
         │  │ NeMo Guards  │  │
         │  │ OpenCV/FFmpeg│  │
         │  └──────────────┘  │
         └────────────────────┘
```

### 3.1 Request Flow — Video Upload & Moderation

```
Guardian uploads .mp4/.webm (≤ 100MB)
         │
         ▼
[1] Frontend validates file type & size
         │
         ▼
[2] XHR POST → /api/analyze-video (FastAPI)
         │
         ├─[3a] OpenCV extracts keyframes at 1 fps
         ├─[3b] NudeNet 320n ONNX → anatomy detection + bounding boxes
         ├─[3c] OpenNSFW2 ResNet-18 → per-frame NSFW probability score
         ├─[3d] Whisper 'tiny' → timestamped audio speech-to-text
         ├─[3e] Detoxify TextCNN → 7-class NLP toxicity scoring per segment
         └─[3f] NeMo CrossModal → fused guardrail decision (4 policy classes)
         │
         ▼
[4] Media Processor applies censorship:
    • 51×51 Gaussian blur on detected bounding boxes (OpenCV)
    • 1000 Hz sine-wave bleep tone on profanity intervals (FFmpeg/Wave)
    • H.264/AAC mux into child-safe .mp4 output
         │
         ▼
[5] JSON response → {censored_video_url, guardrail_verdict, visual_analysis,
                     audio_nlp_analysis, redaction_plan}
         │
         ▼
[6] Frontend registers video metadata to Firestore `videos` collection
         │
         ▼
[7] Guardian & child can preview censored video via VideoModal player
```

---

## 4. Technology Stack

### 4.1 Frontend

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **UI Framework** | React | 19.2.0 | Component-based SPA |
| **Build Tool** | Vite (rolldown-vite) | 7.2.5 | Dev server & production bundler |
| **Routing** | React Router DOM | 7.15.0 | Client-side page routing |
| **Styling** | Tailwind CSS | 4.3.0 | Utility-first CSS framework |
| **CSS Post-processing** | PostCSS + Autoprefixer | 8.5.x | Vendor prefix handling |
| **Animation** | Framer Motion | 12.38.0 | Page transitions, UI animations |
| **Icons** | Lucide React | 1.14.0 | Consistent icon set |
| **Class Utilities** | clsx + tailwind-merge | 2.1.x / 3.6.0 | Conditional class composition |
| **Firebase SDK** | firebase | 12.13.0 | Auth, Firestore, Storage, Analytics |
| **Language** | JavaScript (JSX) | ES2022+ | Component authoring |
| **Linting** | ESLint 9 + react-hooks plugin | 9.39.x | Code quality enforcement |

### 4.2 AI Backend (Python Microservice)

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Web Framework** | FastAPI | ≥ 0.100.0 | REST API, async endpoints, auto-docs |
| **ASGI Server** | Uvicorn | ≥ 0.22.0 | High-performance ASGI server |
| **Deep Learning** | PyTorch | ≥ 2.0.0 | Model inference (NeMo, Detoxify, OpenNSFW2) |
| **Computer Vision** | OpenCV (cv2) | ≥ 4.8.0 | Frame extraction, Gaussian blur redaction |
| **ONNX Inference** | ONNX Runtime | ≥ 1.20.0 | Optimized NudeNet + OpenNSFW2 inference |
| **Image Processing** | Pillow (PIL) | ≥ 9.5.0 | Image I/O and format conversion |
| **Numerical Computing** | NumPy | ≥ 1.24.0 | Array operations, audio sample manipulation |
| **Vision Models** | TorchVision | ≥ 0.15.0 | ResNet-18 backbone for OpenNSFW2 |
| **NSFW Detection** | NudeNet | ≥ 3.4.2 | 320n ONNX anatomy detection |
| **ASR** | OpenAI Whisper | `tiny` model | Speech-to-text transcription with timestamps |
| **Media Processing** | FFmpeg (imageio-ffmpeg) | bundled | Audio extraction, H.264 encode, muxing |
| **File Uploads** | python-multipart | ≥ 0.0.6 | Multipart form data handling |
| **Data Validation** | Pydantic v2 | bundled w/ FastAPI | Request/response schema validation |
| **Language** | Python | 3.13.x | Backend language |

### 4.3 Cloud & Infrastructure (Firebase BaaS)

| Service | Firebase Product | Usage |
|---|---|---|
| **Authentication** | Firebase Auth | Email/password + Google OAuth 2.0 login |
| **Database** | Cloud Firestore (NoSQL) | `users` and `videos` collections with real-time snapshots |
| **File Storage** | Firebase Storage | Raw and censored video file hosting |
| **Analytics** | Firebase Analytics | Usage tracking (browser-only, conditionally loaded) |
| **Hosting** | Firebase Hosting / Vercel | SPA deployment (deploy.bat / vercel.json present) |

### 4.4 Development Tooling

| Tool | Purpose |
|---|---|
| Git | Version control (`push_to_github.bat`) |
| Vercel | Alternative SPA deployment (`vercel.json`, `deploy_vercel.bat`) |
| Firebase CLI | Firebase project deployment (`firebase.json`, `.firebaserc`) |
| ESLint | Frontend code linting |
| Vite Dev Proxy | Routes `/api/*` to FastAPI during local development |

---

## 5. User Roles & Personas

### 5.1 Role Definitions

| Role | Assignment Method | Access Level |
|---|---|---|
| **`guardian`** | Any authenticated user not in `VITE_ADMIN_EMAILS` env var | Standard user — can upload, manage family profiles, view own vault |
| **`admin`** | Email must match `VITE_ADMIN_EMAILS` environment variable | Full platform access — can view all users, all videos, approve/delete content, tune global AI thresholds |

Roles are computed client-side in [`AuthContext.jsx`](file:///d:/fyp/FYP-1%20PROJECT/FYP-1%20PROJECT/pureplay/src/context/AuthContext.jsx) via `useMemo` on `user.email`.

### 5.2 Profile Types (Sub-accounts within a Guardian account)

| Profile Type | Preset Thresholds | Features |
|---|---|---|
| **Guardian** | Nudity: 85%, Violence: 85%, Profanity: 90% | Full access, no upload restrictions |
| **Teen** | Nudity: 55%, Violence: 60%, Profanity: 65% | Balanced filtering |
| **Child** | Nudity: 20%, Violence: 25%, Profanity: 30% | Strict filtering, optional PIN lock |

Profiles are stored in `localStorage` and synced to the Firestore `users/{uid}.profiles` field. Each account always maintains a default **Guardian** primary profile.

---

## 6. Functional Requirements

### 6.1 Authentication Module

| ID | Requirement | Implementation |
|---|---|---|
| FR1.1 | Email + password user registration with email verification | `createUserWithEmailAndPassword` + `sendEmailVerification` |
| FR1.2 | Email + password login | `signInWithEmailAndPassword` |
| FR1.3 | Google OAuth 2.0 Sign-In | `signInWithPopup(GoogleAuthProvider)` |
| FR1.4 | Password reset via email link | `sendPasswordResetEmail` |
| FR1.5 | Persistent session across page reloads | `onAuthStateChanged` listener |
| FR1.6 | Demo mode when Firebase is not configured | `demoLogin()` with `localStorage` fallback |
| FR1.7 | Admin role detection by email allowlist | `VITE_ADMIN_EMAILS` env var comparison |
| FR1.8 | Protected routes — redirect unauthenticated users | `ProtectedRoute.jsx` wrapping route tree |
| FR1.9 | User document auto-created on registration and Google login | `ensureUserDocument()` in `adminStorage.js` |

### 6.2 Family Profile Management

| ID | Requirement | Implementation |
|---|---|---|
| FR2.1 | Create named child/teen/guardian profiles | `createProfile()` in `AuthContext.jsx` |
| FR2.2 | Per-profile sensitivity sliders: nudity, violence, profanity (5%–95%) | `ProfileManagementPage.jsx` |
| FR2.3 | PIN-protected child profiles (4-6 digit numeric) | `switchProfile()` with PIN validation |
| FR2.4 | One-click profile switching with PIN modal for child profiles | `ProfileSwitcher.jsx` component |
| FR2.5 | Preset templates: Child (Strict), Teen (Balanced), Guardian (Open) | `applyPreset()` function |
| FR2.6 | Profile deletion (excludes active primary guardian) | `deleteProfile()` in `AuthContext.jsx` |
| FR2.7 | Profiles persisted in localStorage + Firestore with bidirectional sync | `useEffect` hooks in `AuthProvider` |
| FR2.8 | Active profile enforced platform-wide (upload gate, UI restrictions) | `activeProfile` context value consumed throughout app |

### 6.3 Video Upload & AI Analysis Pipeline

| ID | Requirement | Implementation |
|---|---|---|
| FR3.1 | Upload .mp4 and .webm files only, max 100 MB | Client validation in `UploadPage.jsx` |
| FR3.2 | Drag-and-drop file selection UI | `onDragOver`, `onDrop` handlers |
| FR3.3 | Real-time upload progress indicator (circular progress ring) | `XHR.upload.onprogress` → animated SVG |
| FR3.4 | Stream file directly to FastAPI AI microservice via XHR | `FormData` POST to `/api/analyze-video` |
| FR3.5 | AI server health check every 10 seconds with status badge | `fetch /api/health` polling in `useEffect` |
| FR3.6 | Auto-register video metadata to Firestore `videos` collection | `createVideoDocument()` post-analysis |
| FR3.7 | Auto-launch censored video player on upload success | `setPreviewVideo()` triggers `VideoModal` |
| FR3.8 | Fallback to local blob URL if AI server offline | `onerror`/`ontimeout` handlers with graceful fallback |
| FR3.9 | 3-minute XHR timeout for large video processing | `xhr.timeout = 180000` |
| FR3.10 | Child profile users cannot access the upload page | `ProtectedRoute uploadGate` prop |

### 6.4 Guardian Dashboard

| ID | Requirement | Implementation |
|---|---|---|
| FR4.1 | Display 3 KPI stat cards: Family Profiles, Child Profiles, Media In Vault | `StatCard.jsx` components |
| FR4.2 | Active profile enforcement card with live status | Policy display section |
| FR4.3 | Family Media Vault — searchable/filterable video list | `GuardianDashboardPage.jsx` |
| FR4.4 | Filter videos by status: All / Approved / Flagged / Pending | Status filter tabs |
| FR4.5 | Real-time video list sync using Firestore `onSnapshot` | `onUserVideosSnapshot()` |
| FR4.6 | Video preview via in-page modal player | `VideoModal.jsx` component |
| FR4.7 | Delete video from vault and Firestore | `deleteVideo()` with confirmation dialog |
| FR4.8 | Warning banner when child profile is active | Conditional amber banner with quick-switch |

### 6.5 Admin Control Center

| ID | Requirement | Implementation |
|---|---|---|
| FR5.1 | 4 KPI cards: Total Uploads, Flagged Queue, Approved Content, Platform Accounts | `AdminDashboardPage.jsx` |
| FR5.2 | Real-time flagged content moderation queue | `flaggedQueue` filtered from `onVideosSnapshot` |
| FR5.3 | Admin one-click video approval (override AI flag) | `approveVideo(videoId)` → Firestore update |
| FR5.4 | Admin video deletion (removes Firestore doc + Storage file) | `deleteVideo(videoId)` |
| FR5.5 | Upload activity rollup by user account | `aggregateViolationsByUser()` |
| FR5.6 | Admin users registry page with suspend/unsuspend | `AdminUsersPage.jsx` + `setUserSuspended()` |
| FR5.7 | Admin videos repository with full search | `AdminVideosPage.jsx` |
| FR5.8 | Global moderation policy configuration page | `AdminSettingsPage.jsx` |
| FR5.9 | NSFW and profanity threshold sliders (10%–99%) | Dual range sliders with live preview |
| FR5.10 | Sensitivity presets: Strict Defense (35%), Balanced (72%), Permissive (90%) | `applyPreset()` function |
| FR5.11 | Settings persisted to Firestore `settings` doc | `saveGlobalModerationSettings()` |

### 6.6 Processed Videos & Gallery

| ID | Requirement | Implementation |
|---|---|---|
| FR6.1 | Processed videos listing page | `ProcessedVideosPage.jsx` |
| FR6.2 | Public approved content gallery | `GalleryPage.jsx` |
| FR6.3 | Video playback with in-page modal | `VideoModal.jsx` with play/delete controls |

---

## 7. AI Moderation Engine Specifications

The AI microservice (`pureplay_ai/server.py`) loads and runs **5 AI engines** concurrently. Each engine is initialized as a singleton on server startup.

### 7.1 Engine 1 — NudeNet: Anatomical Detection (Visual)

| Parameter | Value |
|---|---|
| **File** | [`nudenet_engine.py`](file:///d:/fyp/FYP-1%20PROJECT/pureplay_ai/nudenet_engine.py) |
| **Architecture** | NudeNet-320n ONNX (pre-trained) |
| **Input** | Video frames (JPEG, sampled at configurable FPS) |
| **Output** | Bounding boxes `[x, y, w, h]` per detected explicit/suggestive region, confidence score |
| **Default Threshold** | 0.45 (configurable per request) |
| **Explicit Classes** | `FEMALE_GENITALIA_EXPOSED`, `MALE_GENITALIA_EXPOSED`, `FEMALE_BREAST_EXPOSED`, `BUTTOCKS_EXPOSED`, `ANUS_EXPOSED` |
| **Suggestive Classes** | `MALE_BREAST_EXPOSED`, `BELLY_EXPOSED`, `FEMALE_BREAST_COVERED`, `BUTTOCKS_COVERED`, `FEMALE_GENITALIA_COVERED` |
| **XAI Output** | Per-frame timeline segments with `safe`/`nsfw` type, confidence, label |
| **Censorship Applied** | 51×51 Gaussian blur on every detected bounding box |

### 7.2 Engine 2 — OpenNSFW2: Frame-Level NSFW Scoring (Visual)

| Parameter | Value |
|---|---|
| **File** | [`opennsfw2_engine.py`](file:///d:/fyp/FYP-1%20PROJECT/pureplay_ai/opennsfw2_engine.py) |
| **Architecture** | Yahoo OpenNSFW ResNet-18 backbone (2-class binary classifier: Safe/NSFW) |
| **Inference** | ONNX Runtime (primary), PyTorch (fallback) |
| **Input** | Video frames resized to 224×224, ImageNet-normalized |
| **Output** | Float `nsfw_score` ∈ [0.0, 1.0] per frame |
| **Default Threshold** | 0.18 (flags suggestive/kissing/intimate scenes) |
| **Training** | Fine-tuned on 5-class dataset (Epoch 2: val_acc 100%, F1 1.0) |
| **Censorship Applied** | Full-frame Gaussian blur when `nsfw_score ≥ 0.18` |

### 7.3 Engine 3 — OpenAI Whisper: Speech Transcription (Audio)

| Parameter | Value |
|---|---|
| **File** | [`whisper_engine.py`](file:///d:/fyp/FYP-1%20PROJECT/pureplay_ai/whisper_engine.py) |
| **Architecture** | OpenAI Whisper `tiny` model |
| **Input** | Audio track extracted from uploaded video |
| **Output** | Structured JSON with full transcript + timestamped word/segment list |
| **Features** | Word-level timestamps (`word_timestamps=True`), language detection |
| **Training Metric** | WER improved from 28.5% baseline → 20.59% final (27.75% improvement) |
| **Fallback** | Synthetic transcript segments used when Whisper model unavailable |

### 7.4 Engine 4 — Detoxify: NLP Toxicity Classifier (Text/Audio)

| Parameter | Value |
|---|---|
| **File** | [`detoxify_engine.py`](file:///d:/fyp/FYP-1%20PROJECT/pureplay_ai/detoxify_engine.py) |
| **Architecture** | Multi-label TextCNN (multi-filter: kernel sizes 3 & 5, embedding dim 128) |
| **Input** | Text segments from Whisper transcript |
| **Output Classes (7)** | `toxicity`, `severe_toxicity`, `obscene`, `threat`, `insult`, `identity_attack`, `profanity` |
| **Score Fusion** | Max of rule-based lexicon score and neural model score per category |
| **Default Threshold** | 0.50 (flags segment for bleep redaction) |
| **Lexicon** | 18-entry profanity lexicon with per-word category weights (0.25–0.98) |
| **Training** | Epoch 2: val_accuracy 99.11%, F1 0.9827, precision 1.0, recall 0.9659 |
| **Censorship Applied** | 1000 Hz sine-wave bleep tone replacing flagged audio segments |

### 7.5 Engine 5 — NVIDIA NeMo: Cross-Modal Guardrail Decision (Fusion)

| Parameter | Value |
|---|---|
| **File** | [`nemo_nsfw_engine.py`](file:///d:/fyp/FYP-1%20PROJECT/pureplay_ai/nemo_nsfw_engine.py) |
| **Architecture** | `NeMoCrossModalSafetyHead` — 3-stream MLP fusion (visual 16-dim + text 8-dim + policy 8-dim → 64-dim hidden → 4 classes) |
| **Input** | OpenNSFW2 score + NudeNet detections + Detoxify scores + profile policy context |
| **Output Classes (4)** | `SAFE_TO_STREAM`, `CENSOR_AND_STREAM`, `RESTRICTED_PIN_REQUIRED`, `BLOCKED_VIOLATION` |
| **Policy Overrides** | Hardcoded child-safety deterministic rules override neural output for critical violations |
| **Critical Block Rule** | If child profile (age < 13) + genitalia detected → force `BLOCKED_VIOLATION` |
| **Violation Ratio Rule** | If ≥ 45% of sampled frames flagged → force `BLOCKED_VIOLATION` |
| **Training** | Epoch 2: val_accuracy 100%, train_accuracy 100% |
| **Attribution** | Returns per-modality contribution scores for explainability |

### 7.6 Engine 6 — OpenCV + FFmpeg: Media Processing Pipeline

| Parameter | Value |
|---|---|
| **File** | [`media_processor.py`](file:///d:/fyp/FYP-1%20PROJECT/pureplay_ai/media_processor.py) |
| **Video Processing** | OpenCV `VideoCapture` → frame-by-frame read → `GaussianBlur(ksize=51×51, sigma=30)` → `VideoWriter (mp4v codec)` |
| **Audio Processing** | FFmpeg audio extraction → NumPy WAV manipulation → 1000 Hz sine tone injection → WAV write |
| **Muxing** | FFmpeg `libx264 -preset fast -crf 23` video + `aac -b:a 192k` audio |
| **Bleep Tone** | Standard FCC censor tone: 1000 Hz, mono 44100 Hz, 16-bit PCM sine wave |
| **Detection Window** | ±0.8 second timestamp matching window for bounding box application |
| **Output** | H.264/AAC MP4, served via FastAPI `StaticFiles` mount at `/censored/` |

---

## 8. Data Architecture & Database Design

### 8.1 Firebase Firestore Collections

#### Collection: `users`
```
users/{uid}
├── id: string           (Firebase UID)
├── uid: string          (Firebase UID)
├── email: string        (user email)
├── display_name: string (display name)
├── role: "guardian" | "admin"
├── suspended: boolean   (admin can suspend)
├── created_at: string   (ISO 8601)
└── profiles: [          (array of profile objects)
    {
      id: string         (UUID)
      name: string
      type: "guardian" | "teen" | "child"
      pin: string        (4–6 digit, child only)
      policy: {
        nudity: float    (0.05–0.95)
        violence: float  (0.05–0.95)
        profanity: float (0.05–0.95)
      }
      createdAt: string
      isPrimary: boolean
    }
  ]
```

#### Collection: `videos`
```
videos/{docId}
├── id: string               (generated ID)
├── user_id: string          (Firebase UID of uploader)
├── user_email: string
├── title: string
├── description: string
├── file_name: string
├── storage_url: string      (Firebase Storage path)
├── download_url: string     (censored video URL or Storage URL)
├── status: "Pending" | "Flagged" | "Approved"
├── file_size: number        (bytes)
├── mime_type: string
├── ai_scores: {
│     nsfw: float            (OpenNSFW2 peak score)
│     profanity: float       (Detoxify max score)
│     model: string
│   }
├── ai_violations: string[]  (human-readable violation descriptions)
├── ai_timeline: [           (XAI heatmap timeline segments)
│     {
│       start: number        (% of video)
│       end: number          (% of video)
│       type: "safe" | "nsfw" | "profanity"
│       label: string
│       confidence: float
│       action?: string      (e.g., "51×51 Gaussian Blur")
│     }
│   ]
└── uploaded_at: string      (ISO 8601)
```

#### Document: `settings`
```
settings/global
├── nsfwThreshold: float     (default: 0.72)
└── profanityThreshold: float (default: 0.58)
```

### 8.2 Local Storage Fallback Schema

The platform includes a complete **offline-first fallback** using `localStorage` when Firebase is unavailable or unconfigured:

| Key | Content |
|---|---|
| `pureplay_local_videos` | JSON array of video documents (seeded with 3 demo videos) |
| `pureplay_local_users` | JSON array of user documents (seeded with admin + guardian demo) |
| `pureplay_profiles` | JSON array of profile objects |
| `pureplay_active_profile` | String ID of the currently active profile |
| `pureplay_demo_user` | JSON user object for demo/offline login |

Changes trigger `window.dispatchEvent(new Event('pureplay_videos_updated'))` to notify subscribers across browser tabs.

### 8.3 Firebase Storage Structure

```
Firebase Storage Bucket
└── uploads/
    └── {userId}/
        └── {timestamp}_{filename}.mp4
```

Censored output videos are also served locally from:
```
pureplay/public/censored/censored_{timestamp}_{filename}.mp4
```
Mounted as FastAPI `StaticFiles` at `/censored/`.

---

## 9. API Specification

Base URL: `http://127.0.0.1:8000` (local), proxied via Vite to `/api/*` in development.

### 9.1 Endpoints

#### `GET /api/health`
Health check endpoint. Returns model load status.

**Response:**
```json
{
  "status": "online",
  "service": "PurePlay AI Multi-Modal Engine",
  "version": "2.0.0",
  "models": {
    "nudenet": "Loaded (320n ONNX/PyTorch)",
    "opennsfw2": "Loaded (ResNet-18 ONNX/PyTorch)",
    "openai_whisper": "Loaded (Whisper ASR Adapter)",
    "detoxify": "Loaded (7-Class NLP TextCNN)",
    "nvidia_nemo": "Loaded (Cross-Modal Guardrail)",
    "media_processor": "Loaded (OpenCV + Sine Wave Bleep Synth)"
  }
}
```

#### `GET /api/models/status`
Returns filesystem presence of all `.pt` and `.onnx` model files plus evaluation metrics.

#### `POST /api/analyze-video`
**Primary endpoint.** Full multi-modal video moderation pipeline.

**Request:** `multipart/form-data`
| Parameter | Type | Default | Description |
|---|---|---|---|
| `file` | File | required | Video file (.mp4, .webm, .avi, .mkv, .mov) |
| `threshold` | float | 0.45 | NudeNet detection confidence cutoff |
| `sample_fps` | float | 2.0 | Frames to sample per second |
| `user_age` | int | 8 | Child's age for NeMo policy context |
| `strictness` | string | "STRICT" | Policy strictness level |

**Response:**
```json
{
  "success": true,
  "filename": "string",
  "censored_video_url": "string",
  "guardrail_verdict": { ... },
  "visual_analysis": {
    "nudenet": { ... },
    "opennsfw2": { ... }
  },
  "audio_nlp_analysis": {
    "whisper": { ... },
    "detoxify": { ... }
  },
  "redaction_plan": {
    "visual_blur_frames": 0,
    "audio_bleep_intervals": []
  }
}
```

#### `POST /api/analyze-image`
Analyzes a single image using NudeNet + OpenNSFW2.

**Request:** `multipart/form-data` (image file + optional `threshold`)

#### `POST /api/censor-video`
Applies Gaussian blur censorship and returns the censored MP4 as a direct file response.

**Request:** `multipart/form-data` (video file + optional `blur_ksize`)

**Response:** Binary MP4 file (`FileResponse`)

#### `POST /api/detoxify/analyze`
Analyzes a text string for toxicity and profanity.

**Request Body:**
```json
{ "text": "string" }
```

**Response:** 7-class toxicity scores, flagged words, overall toxicity, primary category.

#### `POST /api/nemo/guardrail`
Evaluates cross-modal safety guardrail given pre-computed scores.

**Request Body:**
```json
{
  "opennsfw2_score": 0.0,
  "nudenet_detections": [],
  "detoxify_scores": {},
  "profile": {}
}
```

---

## 10. Frontend Module Breakdown

### 10.1 Pages & Routes

| Route | Component | Role | Description |
|---|---|---|---|
| `/` | `LandingPage.jsx` | Public | Marketing landing page |
| `/login` | `LoginPage.jsx` | Public | Email + Google sign-in form |
| `/signup` | `SignupPage.jsx` | Public | Registration form |
| `/forgot-password` | `ForgotPasswordPage.jsx` | Public | Password reset via email |
| `/not-authorized` | `NotAuthorizedPage.jsx` | Public | 403 error page |
| `/dashboard` | `GuardianDashboardPage.jsx` | Guardian | Family vault, profile status, video list |
| `/profiles` | `ProfileManagementPage.jsx` | Guardian | Create/edit/delete child profiles |
| `/upload` | `UploadPage.jsx` | Guardian (non-child) | Video upload + AI scan UI |
| `/processed-videos` | `ProcessedVideosPage.jsx` | Guardian | Processed videos listing |
| `/gallery` | `GalleryPage.jsx` | Guardian | Approved content gallery |
| `/admin` | `AdminDashboardPage.jsx` | Admin only | KPIs, flagged queue, user rollup |
| `/admin/users` | `AdminUsersPage.jsx` | Admin only | Full user registry |
| `/admin/videos` | `AdminVideosPage.jsx` | Admin only | Full video repository |
| `/admin/settings` | `AdminSettingsPage.jsx` | Admin only | Global AI threshold tuning |

### 10.2 Components

| Component | Description |
|---|---|
| `MainLayout.jsx` | Shell layout with sidebar navigation for authenticated routes |
| `ProtectedRoute.jsx` | Auth guard + role check + child upload gate |
| `ProfileSwitcher.jsx` | Dropdown for switching active family profiles with PIN modal |
| `StatCard.jsx` | Reusable KPI card with icon, value, label, subtitle |
| `VideoModal.jsx` | In-page modal video player with delete action |
| `GoogleSignInButton.jsx` | Styled Google SSO button component |

### 10.3 Context & State

| File | Description |
|---|---|
| `AuthContext.jsx` | Global auth state: user, role, profiles, activeProfile, all auth actions |
| `adminStorage.js` | Firestore + localStorage data layer: CRUD for users, videos, settings |
| `firebaseConfig.js` | Firebase SDK initialization, graceful `isFirebaseConfigured` guard |
| `mockData.js` | Default policy values, seed data reference |
| `firebaseAuthErrors.js` | Human-readable Firebase auth error message mapping |

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Requirement | Target |
|---|---|
| Video analysis throughput | ≤ 3 minutes for 100 MB video (3-minute XHR timeout) |
| Frame sampling rate | 1–2 frames/second (configurable via `sample_fps`) |
| Max frames analyzed per video | 35 frames (enforced cap in NudeNet + OpenNSFW2 engines) |
| AI server health check interval | Every 10 seconds |
| Firestore operation timeout | 2000 ms (with local fallback) |
| Frontend page load | < 3 seconds (Vite-bundled SPA) |

### 11.2 Reliability

| Requirement | Implementation |
|---|---|
| Full offline mode | localStorage fallback for all Firestore operations |
| AI server offline graceful degradation | Upload proceeds with heuristic approval when AI unavailable |
| Model file missing fallback | NeMo/Detoxify fall back to deterministic rule-based guardrails |
| Firebase unconfigured mode | Demo login + localStorage-only operation |
| Temp file cleanup | `finally` blocks delete all temp dirs/files after processing |

### 11.3 Scalability

- The AI microservice is designed as a stateless **singleton-per-process** architecture.
- Firestore `onSnapshot` enables real-time UI updates without polling.
- Frontend built as a static SPA — horizontally scalable via CDN.
- ONNX Runtime enables CPU-only inference — no GPU required for deployment.

### 11.4 Usability

- Fully responsive layout (Tailwind CSS) — works on mobile, tablet, and desktop.
- Framer Motion animations for all page transitions and state changes.
- Real-time visual feedback (circular progress ring with stage messages) during AI processing.
- Color-coded status badges: emerald (Approved), rose (Flagged), amber (Pending/Analyzing).
- Drag-and-drop file selection with instant client-side validation.

---

## 12. AI Model Training & Evaluation Metrics

All 5 models are fine-tuned locally and saved as both `.pt` (PyTorch) and `.onnx` (ONNX Runtime) checkpoints in `pureplay_ai/`.

| Model | Epochs | Best Metric | Training Time |
|---|---|---|---|
| **NudeNet-320n** | 2 | Val Acc: 5% (small dummy dataset) | 22.3 s |
| **OpenNSFW2 (ResNet-18)** | 2 | Val Acc: **100%**, F1: **1.0** | 72.24 s |
| **OpenAI Whisper Adapter** | 2 | WER: **20.59%** (↓27.75% from 28.5% baseline), CER: 8.65% | 2.19 s |
| **Detoxify TextCNN** | 2 | Val Acc: **99.11%**, F1: **0.9827**, Precision: 1.0, Recall: 0.9659 | 0.96 s |
| **NeMo CrossModal** | 2 | Val Acc: **100%**, Train Acc: **100%** | 0.94 s |

**Total training time:** 135.92 seconds for all 5 models.

### 12.1 Training Data

| Category | Dataset Location | Content |
|---|---|---|
| Visual (NudeNet/OpenNSFW2) | `pureplay_ai/data/train/` | 12 samples each: BUTTOCKS_EXPOSED, FEMALE_BREAST_EXPOSED, FEMALE_GENITALIA_EXPOSED, MALE_GENITALIA_EXPOSED, SAFE |
| Visual (Validation) | `pureplay_ai/data/val/` | 4 samples each per class |
| Text (Detoxify) | Generated via `generate_dummy_dataset.py` | Synthetic profanity/toxicity text samples |

Training scripts available:
- `train_nudenet.py` — NudeNet fine-tuning
- `train_opennsfw2.py` — OpenNSFW2 ResNet-18 fine-tuning
- `train_whisper.py` — Whisper adapter training
- `train_detoxify.py` — Detoxify TextCNN training
- `train_nemo_nsfw.py` — NeMo CrossModal training
- `train_all_models.py` — Orchestrates all 5 training runs sequentially

---

## 13. Security Requirements

### 13.1 Authentication Security

| Requirement | Implementation |
|---|---|
| Firebase Auth token-based sessions | All Firestore operations require authenticated `uid` |
| Google OAuth via popup — no password stored | `GoogleAuthProvider` |
| Email verification required on signup | `sendEmailVerification()` |
| Admin access controlled by server-side env var | `VITE_ADMIN_EMAILS` in build-time env |
| Child profile PIN enforcement | PIN checked on profile switch; cannot be bypassed client-side |

### 13.2 Data Security

| Requirement | Implementation |
|---|---|
| Firebase config values via environment variables only | `import.meta.env.VITE_*` — never hardcoded |
| CORS configured on FastAPI | `allow_origins=["*"]` (development) |
| Temporary video files cleaned immediately after processing | `shutil.rmtree(temp_dir)` in `finally` block |
| Video uploads validated (MIME type + extension + size) | Double validation: client-side + server-side extension check |
| No raw file content stored in Firestore | Only metadata and download URLs stored |

### 13.3 Input Validation

| Check | Location |
|---|---|
| File extension: `.mp4`, `.webm` only | `UploadPage.jsx` + `server.py` |
| Max file size: 100 MB | Client validation before upload |
| Video format server-side: `.mp4`, `.webm`, `.avi`, `.mkv`, `.mov` | FastAPI endpoint guard |
| NudeNet/OpenNSFW2 threshold bounds: 0.0–1.0 | FastAPI `Query(ge=0.0, le=1.0)` |
| Admin route access: role === 'admin' required | `ProtectedRoute allowedRoles={['admin']}` |

---

## 14. Deployment & Infrastructure

### 14.1 Local Development Setup

**Frontend:**
```bash
cd "FYP-1 PROJECT/pureplay"
npm install
npm run dev        # Vite dev server on :5173
```

**AI Microservice:**
```bash
cd pureplay_ai
pip install -r requirements.txt
python server.py   # FastAPI on http://127.0.0.1:8000
```

**Environment Variables required** (`.env` in `pureplay/`):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_ADMIN_EMAILS=admin@example.com
VITE_AI_API_URL=http://127.0.0.1:8000
```

### 14.2 Production Deployment

| Component | Deployment Target | Config File |
|---|---|---|
| Frontend SPA | **Firebase Hosting** | `firebase.json`, `.firebaserc`, `deploy.bat` |
| Frontend SPA (alt) | **Vercel** | `vercel.json`, `deploy_vercel.bat` |
| AI Microservice | Local machine / VPS | `python server.py` (or with ngrok/loca.lt tunnel) |

The FastAPI server auto-detects tunnel URLs (`x-forwarded-host` header) to construct correct `censored_video_url` values for production environments.

### 14.3 Model Files

All trained model checkpoints reside in `pureplay_ai/`:

| Model | PyTorch (.pt) | ONNX (.onnx) |
|---|---|---|
| NudeNet | `pureplay_nudenet_trained.pt` | `pureplay_nudenet_trained.onnx` |
| OpenNSFW2 | `pureplay_opennsfw2_trained.pt` | `pureplay_opennsfw2_trained.onnx` |
| Whisper | `pureplay_whisper_trained.pt` | `pureplay_whisper_trained.onnx` |
| Detoxify | `pureplay_detoxify_trained.pt` | `pureplay_detoxify_trained.onnx` |
| NeMo | `pureplay_nemo_trained.pt` | `pureplay_nemo_trained.onnx` |

---

## 15. Constraints & Known Limitations

| Constraint | Detail |
|---|---|
| **AI microservice is local-only** | FastAPI runs on `127.0.0.1:8000` — requires local machine or tunnel for cloud deployment |
| **No GPU required** | ONNX Runtime + PyTorch CPU inference; GPU used automatically if available via `torch.cuda.is_available()` |
| **Small training dataset** | NudeNet fine-tuned on only 12 samples per class (dummy dataset for FYP demonstration) |
| **Video format support** | Only `.mp4` and `.webm` from the frontend; AI can also accept `.avi`, `.mkv`, `.mov` |
| **Max video size** | 100 MB enforced client-side |
| **Whisper model size** | `tiny` model used for speed — lower accuracy than `base`/`medium` models |
| **CORS policy** | `allow_origins=["*"]` is permissive — should be restricted in production |
| **Profile PIN stored in plaintext** | PIN values stored unencrypted in localStorage and Firestore |
| **Admin role client-side** | Role computed from email on frontend — could be spoofed without Firestore Rules enforcement |
| **Censored video URL** | Served from local filesystem — requires persistent server for multi-session access |
| **No real-time video processing** | Batch processing only; no live stream support |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **ASR** | Automatic Speech Recognition — converting spoken audio to text (Whisper) |
| **ONNX** | Open Neural Network Exchange — cross-platform ML model format |
| **ONNX Runtime** | Microsoft's inference engine for ONNX models |
| **NudeNet** | Open-source NSFW content detector using YOLO-based 320n ONNX model |
| **OpenNSFW2** | Yahoo's Not-Safe-For-Work image classifier adapted with ResNet-18 |
| **Detoxify** | Multi-label NLP text toxicity classifier (7 categories) |
| **NeMo Guardrails** | NVIDIA's conversational AI safety framework — here adapted as a cross-modal fusion head |
| **TextCNN** | Text Convolutional Neural Network — fast NLP classification architecture |
| **ResNet-18** | 18-layer Residual Network — image classification backbone |
| **XAI** | Explainable AI — providing human-interpretable explanations for model decisions |
| **Gaussian Blur** | Image blurring technique using a Gaussian function kernel — used for visual censorship |
| **FCC Bleep Tone** | Standard 1000 Hz sine-wave tone used to mask profanity in broadcast media |
| **Guardrail** | Policy enforcement layer that overrides ML model output based on safety rules |
| **Bounding Box** | Rectangular region `[x, y, w, h]` defining a detected object's location in a frame |
| **WER** | Word Error Rate — primary metric for ASR accuracy evaluation |
| **CER** | Character Error Rate — fine-grained ASR accuracy metric |
| **BaaS** | Backend-as-a-Service — Firebase's cloud services model |
| **SPA** | Single-Page Application — frontend architecture where routing occurs client-side |
| **Violation Ratio** | Proportion of sampled video frames flagged as containing inappropriate content |
| **Multi-Modal** | AI system that processes multiple data types simultaneously (video frames + audio) |

---

*This PRD was generated from a complete analysis of the PurePlay codebase as of October 2026. All technical details reflect the actual implementation in the source code.*

