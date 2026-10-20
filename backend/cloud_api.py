"""Small authenticated HTTP service. No ML imports; used by modal_app.py.

The demo intentionally handles one HTTP input per container and uses one API
container so Volume reloads never race an open upload/playback file.
"""

import json
import os
import re
import secrets
import shutil
import time
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

MAX_UPLOAD_BYTES = 100 * 1024 * 1024
MAX_STORED_BYTES = 1024 * 1024 * 1024
JOB_DEADLINE_SECONDS = 40 * 60


def write_json(path, data):
    path = Path(path)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data), encoding="utf-8")
    temporary.replace(path)


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def firebase_verifier(project_id):
    import cachecontrol
    import requests
    from google.auth.transport.requests import Request as GoogleRequest
    from google.oauth2 import id_token

    # ID token verification uses Google's public signing certificates. It does
    # not need a service-account private key or Firestore admin permissions.
    if os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"):
        raise RuntimeError("Firebase emulator must not be enabled in the cloud")
    project_id = project_id.strip()
    if not project_id:
        raise RuntimeError("FIREBASE_PROJECT_ID must be set")
    # Project IDs are public identifiers; never log the user's token.
    print(f"[Auth] Verifying Firebase tokens for project: {project_id}")
    request = GoogleRequest(session=cachecontrol.CacheControl(requests.Session()))

    def verify(token):
        claims = id_token.verify_firebase_token(token, request, audience=project_id)
        uid = claims.get("sub")
        if claims.get("iss") != f"https://securetoken.google.com/{project_id}":
            raise ValueError("Invalid Firebase token issuer")
        if not isinstance(uid, str) or not 1 <= len(uid) <= 128:
            raise ValueError("Invalid Firebase user ID")
        auth_time = claims.get("auth_time")
        if not isinstance(auth_time, (int, float)) or auth_time > time.time():
            raise ValueError("Invalid Firebase authentication time")
        return {**claims, "uid": uid}

    return verify


def create_app(root, volume, submit_job, verify_token, origins, allowed_uids):
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    if not origins or "*" in origins or not allowed_uids:
        raise RuntimeError("Set explicit ALLOWED_ORIGINS and ALLOWED_USER_UIDS")

    api = FastAPI(title="PurePlay Cloud API", version="1.0")
    api.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["Accept-Ranges", "Content-Range"],
    )

    def current_uid(request: Request):
        scheme, _, token = request.headers.get("authorization", "").partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(401, "Sign in with your Firebase account first")
        try:
            uid = verify_token(token)["uid"]
        except Exception:
            raise HTTPException(401, "Login expired or invalid; sign in again") from None
        if "*" not in allowed_uids and uid not in allowed_uids:
            raise HTTPException(403, "This account is not in ALLOWED_USER_UIDS")
        return uid

    def get_job(job_id):
        if not re.fullmatch(r"[0-9a-f]{32}", job_id):
            raise HTTPException(404, "Job not found")
        volume.reload()
        directory = root / job_id
        if not (directory / "job.json").is_file():
            raise HTTPException(404, "Job not found")
        return directory, read_json(directory / "job.json")

    def job_status(directory, job):
        path = directory / "status.json"
        state = read_json(path) if path.exists() else {"status": "queued"}
        if state["status"] in {"queued", "processing"} and time.time() - job["created_at"] > JOB_DEADLINE_SECONDS:
            return {"status": "failed", "error": "Job exceeded the demo time limit; check Modal logs"}
        return state

    @api.get("/api/health")
    def health():
        # Readiness of this lightweight API is distinct from model readiness.
        return {"status": "online", "mode": "jobs", "service": "PurePlay Cloud API",
                "pipeline": "cuts-v1", "max_duration_seconds": 180}

    @api.post("/api/jobs", status_code=202)
    async def submit(request: Request, uid=Depends(current_uid)):
        # A raw body allows size limits before multipart parsing/spooling.
        extension = request.query_params.get("extension", "").lower()
        if extension not in {".mp4", ".webm"}:
            raise HTTPException(400, "Only .mp4 and .webm files are supported")
        length = request.headers.get("content-length")
        if length and (not length.isdigit() or int(length) > MAX_UPLOAD_BYTES):
            raise HTTPException(413, "Maximum upload size is 100 MB")
        volume.reload()
        # One outstanding job per allowed demo account, plus a small disk cap.
        for metadata in root.glob("*/job.json"):
            previous = read_json(metadata)
            if previous["uid"] == uid and job_status(metadata.parent, previous)["status"] in {"queued", "processing"}:
                raise HTTPException(409, "A video is already queued or processing for this account")
        stored_bytes = sum(p.stat().st_size for p in root.rglob("*") if p.is_file())
        if stored_bytes >= MAX_STORED_BYTES:
            raise HTTPException(507, "Demo storage is full; delete old jobs in Modal Volumes")

        job_id = uuid.uuid4().hex
        directory = root / job_id
        directory.mkdir()
        source = directory / ("input" + extension)
        try:
            size = 0
            with source.open("wb") as output:
                async for chunk in request.stream():
                    size += len(chunk)
                    if size > MAX_UPLOAD_BYTES:
                        raise HTTPException(413, "Maximum upload size is 100 MB")
                    if stored_bytes + size > MAX_STORED_BYTES:
                        raise HTTPException(507, "Demo storage is full; delete old jobs in Modal Volumes")
                    output.write(chunk)
            if size == 0:
                raise HTTPException(400, "The uploaded file is empty")
            job = {"uid": uid, "created_at": time.time(), "extension": extension,
                   "playback_token": secrets.token_urlsafe(32)}
            write_json(directory / "job.json", job)
            volume.commit()
            # This enqueues work and returns immediately; it does not await ML.
            submit_job(job_id)
        except Exception:
            # Do not erase a possibly running job after an ambiguous spawn error.
            # The status deadline lets the user recover from a lost submission.
            if not (directory / "job.json").exists():
                shutil.rmtree(directory)
                volume.commit()
            raise
        return {"job_id": job_id, "status": "queued"}

    @api.get("/api/jobs/{job_id}")
    def status(job_id: str, uid=Depends(current_uid)):
        directory, job = get_job(job_id)
        if job["uid"] != uid:
            raise HTTPException(404, "Job not found")
        state = job_status(directory, job)
        if state["status"] == "complete":
            result = read_json(directory / "result.json")
            # Relative URL avoids trusting forwarded host headers. The browser
            # resolves it against its configured VITE_AI_API_URL.
            result["censored_video_url"] = f"/api/media/{job_id}?token={job['playback_token']}"
            return {"job_id": job_id, "status": "complete", "result": result}
        return {"job_id": job_id, **state}

    @api.get("/api/media/{job_id}")
    def media(job_id: str, token: str = ""):
        directory, job = get_job(job_id)
        if not secrets.compare_digest(token, job["playback_token"]):
            raise HTTPException(404, "Video not found")
        if job_status(directory, job)["status"] != "complete":
            raise HTTPException(404, "Video is not ready")
        return FileResponse(directory / "output.mp4", media_type="video/mp4",
                            headers={"Cache-Control": "private, no-store"})

    @api.delete("/api/jobs/{job_id}")
    def delete(job_id: str, uid=Depends(current_uid)):
        directory, job = get_job(job_id)
        if job["uid"] != uid:
            raise HTTPException(404, "Job not found")
        if job_status(directory, job)["status"] in {"queued", "processing"}:
            raise HTTPException(409, "Wait for processing to finish before deleting")
        shutil.rmtree(directory)
        volume.commit()
        return {"deleted": True}

    return api
