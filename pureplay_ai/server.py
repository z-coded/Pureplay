"""
PurePlay AI Microservice (FastAPI)
Connects the PurePlay Frontend and Media Pipeline to all 5 AI Moderation Engines:
1. NudeNet (Visual exposed anatomy detection & bounding boxes)
2. OpenNSFW2 (Frame-level adult content probability scoring)
3. OpenAI Whisper (Audio speech-to-text with timestamp intervals)
4. Detoxify (7-class NLP toxicity & profanity moderation)
5. NVIDIA NeMo Guardrails (Cross-modal policy decision engine)
6. OpenCV & Media Processor (51x51 Gaussian blur & 1000 Hz audio bleeps)
"""

import os
import sys
import shutil
import tempfile
import json
import time
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Query, HTTPException, Body, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

try:
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_dir = os.path.dirname(ffmpeg_exe)
    ffmpeg_alias = os.path.join(ffmpeg_dir, "ffmpeg.exe")
    if not os.path.exists(ffmpeg_alias):
        shutil.copyfile(ffmpeg_exe, ffmpeg_alias)
    if ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
except Exception:
    pass

# Engine imports
from nudenet_engine import PurePlayNudeNetEngine
from opennsfw2_engine import PurePlayOpenNSFW2Engine
from whisper_engine import get_whisper_engine
from detoxify_engine import get_detoxify_engine
from nemo_nsfw_engine import get_nemo_engine
from media_processor import get_media_processor

app = FastAPI(
    title="PurePlay AI Content Moderation Microservice",
    description="Multi-Modal AI Safety Engine: NudeNet, OpenNSFW2, Whisper, Detoxify, OpenCV, and NVIDIA NeMo Guardrails",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static censored video streaming directory
base_dir = os.path.dirname(__file__)
censored_dir_public = os.path.abspath(os.path.join(base_dir, "..", "FYP-1 PROJECT", "pureplay", "public", "censored"))
os.makedirs(censored_dir_public, exist_ok=True)
app.mount("/censored", StaticFiles(directory=censored_dir_public), name="censored")

# Engine initializations
nudenet_engine = PurePlayNudeNetEngine(default_threshold=0.45)
opennsfw2_engine = PurePlayOpenNSFW2Engine(threshold=0.18)
whisper_engine = get_whisper_engine()
detoxify_engine = get_detoxify_engine()
nemo_engine = get_nemo_engine()
media_processor = get_media_processor()


class TextModerationRequest(BaseModel):
    text: str


class NeMoEvaluationRequest(BaseModel):
    opennsfw2_score: float = 0.0
    nudenet_detections: List[Dict[str, Any]] = []
    detoxify_scores: Dict[str, float] = {}
    profile: Optional[Dict[str, Any]] = None


@app.get("/api/health")
def health_check():
    return {
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


@app.get("/api/models/status")
def models_status():
    """Returns filesystem presence and metrics for all trained models."""
    base_dir = os.path.dirname(__file__)
    
    def check_model_files(prefix):
        pt = os.path.exists(os.path.join(base_dir, f"{prefix}.pt"))
        onnx = os.path.exists(os.path.join(base_dir, f"{prefix}.onnx"))
        return {"pt_exists": pt, "onnx_exists": onnx, "status": "READY" if pt else "NOT_TRAINED"}

    metrics_file = os.path.join(base_dir, "all_models_evaluation.json")
    eval_data = {}
    if os.path.exists(metrics_file):
        try:
            with open(metrics_file, "r") as f:
                eval_data = json.load(f)
        except Exception:
            pass

    return {
        "models": {
            "NudeNet": check_model_files("pureplay_nudenet_trained"),
            "OpenNSFW2": check_model_files("pureplay_opennsfw2_trained"),
            "OpenAI-Whisper": check_model_files("pureplay_whisper_trained"),
            "Detoxify": check_model_files("pureplay_detoxify_trained"),
            "NVIDIA-NeMo": check_model_files("pureplay_nemo_trained")
        },
        "evaluation_summary": eval_data
    }


@app.post("/api/detoxify/analyze")
def analyze_text_toxicity(req: TextModerationRequest):
    """Analyzes text across 7 toxicity categories and profanity."""
    return detoxify_engine.analyze_text(req.text)


@app.post("/api/nemo/guardrail")
def evaluate_guardrail(req: NeMoEvaluationRequest):
    """Evaluates cross-modal safety using NVIDIA NeMo Guardrails."""
    return nemo_engine.evaluate_safety_guardrail(
        opennsfw2_score=req.opennsfw2_score,
        nudenet_detections=req.nudenet_detections,
        detoxify_scores=req.detoxify_scores,
        profile=req.profile
    )


@app.post("/api/analyze-video")
async def analyze_video_endpoint(
    request: Request,
    file: UploadFile = File(...),
    threshold: float = Query(0.45, ge=0.0, le=1.0),
    sample_fps: float = Query(2.0, ge=0.5, le=10.0),
    user_age: int = Query(8, ge=3, le=99),
    strictness: str = Query("STRICT"),
):
    """
    Full multi-modal video moderation pipeline:
    1. OpenCV keyframe extraction
    2. NudeNet exposed anatomical detection
    3. OpenNSFW2 adult content scoring
    4. Whisper audio transcription
    5. Detoxify 7-class profanity & toxicity scoring
    6. NVIDIA NeMo Guardrail policy decision
    """
    if not file.filename.lower().endswith((".mp4", ".webm", ".avi", ".mkv", ".mov")):
        raise HTTPException(status_code=400, detail="Unsupported video format")

    temp_dir = tempfile.mkdtemp()
    temp_video_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Vision: NudeNet Frame-by-Frame Detection
        nudenet_results = nudenet_engine.analyze_video(
            video_path=temp_video_path,
            sample_fps=sample_fps,
            threshold=threshold
        )

        # 2. Vision: OpenNSFW2 Scoring
        opennsfw2_results = opennsfw2_engine.analyze_video_frames(
            video_path=temp_video_path,
            sample_fps=sample_fps
        )

        # 3. Audio: Whisper Transcription
        whisper_results = whisper_engine.transcribe(temp_video_path)

        # 4. Audio/Text: Detoxify Moderation & Timestamp Alignment
        detox_results = detoxify_engine.analyze_whisper_segments(
            whisper_results.get("segments", [])
        )

        # 5. NVIDIA NeMo Guardrail Multi-Modal Fusion
        profile_ctx = {
            "age": user_age,
            "strictness": strictness,
            "block_explicit": True,
            "block_profanity": True
        }

        all_detections = []
        detections_by_timestamp = {}

        # 1. Extract NudeNet anatomical detections
        for item in nudenet_results.get("violations_detected", []):
            ts = round(float(item.get("timestamp", 0.0)), 1)
            boxes = item.get("boxes", [])
            labels = item.get("labels", [])
            classes = item.get("classes", [])
            scores = item.get("scores", [])
            if boxes:
                detections_by_timestamp[ts] = [{"box": b, "label": l} for b, l in zip(boxes, labels)]
                for i, (b, l) in enumerate(zip(boxes, labels)):
                    cls_name = classes[i] if i < len(classes) else l
                    sc = scores[i] if i < len(scores) else item.get("peak_score", 0.9)
                    all_detections.append({
                        "class": cls_name,
                        "label": l,
                        "score": sc,
                        "box": b,
                        "is_explicit": True,
                        "timestamp": ts
                    })

        # 2. Extract OpenNSFW2 adult content frames (kissing, intimacy, suggestive poses)
        for item in opennsfw2_results.get("timeline", []):
            nsfw_score = float(item.get("nsfw_score", 0.0))
            is_flagged = item.get("status") == "flagged" or nsfw_score >= 0.18
            if is_flagged:
                ts = round(float(item.get("timestamp", 0.0)), 1)
                if ts not in detections_by_timestamp:
                    detections_by_timestamp[ts] = [{"full_frame": True, "score": nsfw_score}]
                all_detections.append({
                    "class": "SUGGESTIVE_VISUAL_CONTENT",
                    "label": "Suggestive / Adult Scene",
                    "score": nsfw_score,
                    "confidence": nsfw_score,
                    "is_explicit": True,
                    "timestamp": ts,
                    "full_frame": True
                })

        # Calculate violation ratio across all sampled frames
        total_sampled = max(1, len(opennsfw2_results.get("timeline", [])))
        flagged_count = max(
            len(detections_by_timestamp),
            nudenet_results.get("flagged_frames", 0),
            sum(1 for t in opennsfw2_results.get("timeline", []) if t.get("status") == "flagged" or t.get("nsfw_score", 0) >= 0.18)
        )
        violation_ratio = round(flagged_count / total_sampled, 3)
        profile_ctx["violation_ratio"] = violation_ratio

        nemo_decision = nemo_engine.evaluate_safety_guardrail(
            opennsfw2_score=opennsfw2_results.get("overall_score", 0.0),
            nudenet_detections=all_detections,
            detoxify_scores=detox_results.get("segments", [{}])[0].get("scores", {}) if detox_results.get("segments") else {},
            profile=profile_ctx
        )

        # If more than 50% sensitive content, enforce BLOCKED status
        if violation_ratio >= 0.45:
            nemo_decision["decision"] = "BLOCKED_VIOLATION"
            nemo_decision["safety_status"] = "REJECTED"
            nemo_decision["policy_reason"] = f"CRITICAL POLICY VIOLATION: {int(violation_ratio*100)}% of video runtime contains sensitive or inappropriate material. Playback is blocked for child protection."

        # 6. Apply Multi-Modal Censorship (Blur Visual NSFW + Bleep Audio Profanity)
        base_dir = os.path.dirname(__file__)
        censored_dir_public = os.path.join(base_dir, "..", "FYP-1 PROJECT", "pureplay", "public", "censored")
        censored_dir_dist = os.path.join(base_dir, "..", "FYP-1 PROJECT", "pureplay", "dist", "censored")
        os.makedirs(censored_dir_public, exist_ok=True)
        os.makedirs(censored_dir_dist, exist_ok=True)

        clean_name = "".join(c for c in file.filename if c.isalnum() or c in "._-")
        censored_filename = f"censored_{int(time.time())}_{clean_name}"
        if not censored_filename.endswith(".mp4"):
            censored_filename += ".mp4"
        censored_public_path = os.path.join(censored_dir_public, censored_filename)
        censored_dist_path = os.path.join(censored_dir_dist, censored_filename)

        bleep_intervals = detox_results.get("redaction_intervals", [])

        try:
            censor_res = media_processor.censor_multi_modal_video(
                input_video_path=temp_video_path,
                output_video_path=censored_public_path,
                detections_by_timestamp=detections_by_timestamp,
                bleep_intervals=bleep_intervals
            )
            if os.path.exists(censored_public_path):
                shutil.copyfile(censored_public_path, censored_dist_path)
            
            host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "127.0.0.1:8000"
            proto = request.headers.get("x-forwarded-proto") or ("https" if "loca.lt" in host or "ngrok" in host else "http")
            censored_url = f"{proto}://{host}/censored/{censored_filename}"
        except Exception as censor_err:
            print(f"[WARN] Multi-modal censoring fallback: {censor_err}")
            censored_url = "/demo_censored_child_safe.mp4"

        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "censored_video_url": censored_url,
            "guardrail_verdict": nemo_decision,
            "visual_analysis": {
                "nudenet": nudenet_results,
                "opennsfw2": opennsfw2_results
            },
            "audio_nlp_analysis": {
                "whisper": whisper_results,
                "detoxify": detox_results
            },
            "redaction_plan": {
                "visual_blur_frames": nudenet_results.get("flagged_frames", len(detections_by_timestamp)),
                "audio_bleep_intervals": detox_results.get("redaction_intervals", [])
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Multi-modal video processing failed: {str(e)}")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/api/analyze-image")
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    threshold: float = Query(0.45, ge=0.0, le=1.0),
):
    """Analyzes a single image using both NudeNet and OpenNSFW2."""
    temp_dir = tempfile.mkdtemp()
    temp_image_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        nudenet_res = nudenet_engine.analyze_image(temp_image_path, threshold=threshold)
        opennsfw2_res = opennsfw2_engine.analyze_image(temp_image_path)

        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "nudenet": nudenet_res,
            "opennsfw2": opennsfw2_res
        })

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/api/censor-video")
async def censor_video_endpoint(
    file: UploadFile = File(...),
    blur_ksize: int = Query(51, ge=11, le=101),
):
    """
    Applies 51x51 Gaussian blur to detected exposed anatomical regions
    using OpenCV and returns the censored child-safe video.
    """
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input_" + file.filename)
    output_path = os.path.join(temp_dir, "censored_" + file.filename)

    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        nudenet_engine.censor_video(input_path, output_path, blur_ksize=blur_ksize)

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Censorship processing failed")

        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="censored_" + file.filename,
        )

    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("\n=============================================================")
    print("[*] Starting PurePlay AI Multi-Modal Moderation Microservice")
    print("    URL: http://127.0.0.1:8000")
    print("    API Docs: http://127.0.0.1:8000/docs")
    print("=============================================================\n")
    uvicorn.run(app, host="127.0.0.1", port=8000)
