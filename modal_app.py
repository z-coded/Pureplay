"""Deploy from the repository root: python -m modal deploy modal_app.py

Only the Modal SDK is required on your laptop. ML packages, model loading,
image builds and video processing execute on Modal.
"""

import os
from pathlib import Path

import modal

BACKEND = Path(__file__).parent / "pureplay_ai"
app = modal.App("pureplay-ai")
media_volume = modal.Volume.from_name("pureplay-media", create_if_missing=True)
settings = modal.Secret.from_name("pureplay-config", required_keys=[
    "FIREBASE_PROJECT_ID", "ALLOWED_ORIGINS", "ALLOWED_USER_UIDS",
])

api_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi==0.149.0", "google-auth[requests]>=2.38,<3",
                 "cachecontrol>=0.14,<1", "cryptography>=44")
    .add_local_file(BACKEND / "cloud_api.py", "/opt/pureplay/cloud_api.py")
)


def excluded_backend_file(path):
    path = Path(path)
    return ("__pycache__" in path.parts or "data" in path.parts
            or path.suffix not in {".py", ".json"})


worker_base_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libgl1", "libglib2.0-0")
    .pip_install("torch==2.8.0", "torchvision==0.23.0",
                 index_url="https://download.pytorch.org/whl/cpu")
    .pip_install("nudenet==3.4.2", "onnxruntime>=1.20,<2", "numpy>=1.26,<3",
                 "opencv-python-headless>=4.8,<5", "Pillow>=10,<12",
                 "fastapi==0.149.0", "python-multipart>=0.0.18,<1",
                 "openai-whisper==20250625", "imageio-ffmpeg>=0.6,<1",
                 "transformers==4.57.1", "huggingface-hub==0.36.0")
    .env({"PYTHONPATH": "/opt/pureplay", "PUREPLAY_OUTPUT_DIR": "/tmp/pureplay-output",
          "PUREPLAY_STRICT_INFERENCE": "1", "OMP_NUM_THREADS": "2", "MKL_NUM_THREADS": "2"})
    .run_commands(
        "python -c \"import whisper; whisper.load_model('base', device='cpu')\"",
        "python -c \"from huggingface_hub import snapshot_download; "
        "snapshot_download('MCG-NJU/videomae-base-finetuned-kinetics', "
        "revision='488eb9a0565f257b32866000305c8178965eb9f6', "
        "local_dir='/opt/models/videomae', "
        "allow_patterns=['*.json','*.safetensors','README.md'])\"",
    )
)
worker_image = worker_base_image.add_local_dir(BACKEND, "/opt/pureplay", ignore=excluded_backend_file)


@app.function(image=worker_image, cpu=2, memory=8192, timeout=1800,
              max_containers=1, min_containers=0, scaledown_window=30,
              volumes={"/media": media_volume}, retries=0)
def process_video(job_id: str):
    import shutil
    import tempfile
    import traceback

    from cloud_api import JOB_DEADLINE_SECONDS, read_json, write_json
    import time

    media_volume.reload()
    directory = Path("/media/jobs") / job_id
    job = read_json(directory / "job.json")
    if time.time() - job["created_at"] > JOB_DEADLINE_SECONDS:
        write_json(directory / "status.json", {"status": "failed", "error": "Job expired in queue"})
        media_volume.commit()
        return
    write_json(directory / "status.json", {"status": "processing"})
    media_volume.commit()
    source = directory / ("input" + job["extension"])
    try:
        # Import happens only on the processing worker, never in the web API.
        from filtered_pipeline import FilteringPipeline
        pipeline = FilteringPipeline()
        with tempfile.TemporaryDirectory() as temporary:
            local_input = Path(temporary) / source.name
            shutil.copyfile(source, local_input)
            output = Path(temporary) / "filtered.mp4"
            result = pipeline.process(local_input, output)
            if not result.get("success"):
                raise RuntimeError("Analysis did not succeed")
            if not output.is_file() or output.stat().st_size == 0:
                raise RuntimeError("Rendered video is missing")
            shutil.copyfile(output, directory / "output.mp4")
        result.pop("censored_video_url", None)
        write_json(directory / "result.json", result)
        write_json(directory / "status.json", {"status": "complete"})
    except Exception as exc:
        traceback.print_exc()
        detail = getattr(exc, "detail", str(exc)) or type(exc).__name__
        write_json(directory / "status.json", {
            "status": "failed", "error": f"Video processing failed: {detail}",
        })
    finally:
        source.unlink(missing_ok=True)
        media_volume.commit()


@app.function(image=api_image, cpu=0.25, memory=512, timeout=150,
              max_containers=1, min_containers=0, scaledown_window=30,
              volumes={"/media": media_volume}, secrets=[settings])
@modal.concurrent(max_inputs=1)
@modal.asgi_app()
def api():
    import sys
    sys.path.insert(0, "/opt/pureplay")
    from cloud_api import create_app, firebase_verifier

    return create_app(
        root="/media/jobs", volume=media_volume,
        submit_job=lambda job_id: process_video.spawn(job_id),
        verify_token=firebase_verifier(os.environ["FIREBASE_PROJECT_ID"]),
        origins=[v.strip().rstrip("/") for v in os.environ["ALLOWED_ORIGINS"].split(",") if v.strip()],
        allowed_uids={v.strip() for v in os.environ["ALLOWED_USER_UIDS"].split(",") if v.strip()},
    )
