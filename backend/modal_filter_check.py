"""Cloud-only model/render smoke test: python -m modal run modal_filter_check.py."""
import modal
if modal.is_local():
    from modal_app import worker_base_image, BACKEND, excluded_backend_file
    worker_image = worker_base_image.apt_install("espeak-ng").add_local_dir(
        BACKEND, "/opt/pureplay", ignore=excluded_backend_file)
else:
    worker_image = None

app = modal.App("pureplay-filter-check")
media = modal.Volume.from_name("pureplay-media")


@app.function(image=worker_image, cpu=2, memory=8192, timeout=1200)
def check():
    import tempfile
    import time
    from pathlib import Path
    import numpy as np
    from cut_media import run, plan_cuts, render_cuts
    from filtered_pipeline import FilteringPipeline

    started = time.monotonic()
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        # Green interval is the flagged scene. Red and blue must survive.
        source = root / "source.mp4"
        run(["ffmpeg", "-v", "error", "-y",
             "-f", "lavfi", "-i", "color=red:s=320x240:r=25:d=2",
             "-f", "lavfi", "-i", "color=green:s=320x240:r=25:d=2",
             "-f", "lavfi", "-i", "color=blue:s=320x240:r=25:d=2",
             "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
             "-f", "lavfi", "-i", "sine=frequency=880:duration=2",
             "-f", "lavfi", "-i", "sine=frequency=660:duration=2",
             "-filter_complex", "[0:v][3:a][1:v][4:a][2:v][5:a]concat=n=3:v=1:a=1[v][a]",
             "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-c:a", "aac",
             "-pix_fmt", "yuv420p", str(source)])
        plan = plan_cuts(6, [{"start": 2, "end": 4, "reason": "test"}], padding=0)
        output = root / "cut.mp4"
        metadata = render_cuts(source, output, plan)
        raw = run(["ffmpeg", "-v", "error", "-i", str(output), "-vf",
                   "scale=1:1", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"])
        pixels = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3)
        assert not np.any((pixels[:, 1] > pixels[:, 0]) & (pixels[:, 1] > pixels[:, 2])), "Flagged green frames survived"
        assert pixels[0, 0] > pixels[0, 2] and pixels[-1, 2] > pixels[-1, 0]
        assert metadata["has_audio"]
        audio = run(["ffmpeg", "-v", "error", "-i", str(output), "-vn",
                     "-ac", "1", "-ar", "8000", "-f", "f32le", "-"])
        samples = np.frombuffer(audio, dtype=np.float32)
        peaks = []
        for offset in [0.5, 2.5]:
            fragment = samples[int(offset * 8000):int((offset + 1) * 8000)]
            peaks.append(int(np.fft.rfftfreq(len(fragment), 1 / 8000)[
                np.abs(np.fft.rfft(fragment)).argmax()]))
        assert abs(peaks[0] - 440) <= 2 and abs(peaks[1] - 660) <= 2, peaks
        silent = root / "silent.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-an", "-c:v", "copy", str(silent)])
        assert not render_cuts(silent, root / "silent-cut.mp4", plan)["has_audio"]
        pipeline = FilteringPipeline()
        result = pipeline.process(silent, root / "filtered.mp4")
        assert result["verification"]["passed"]
        assert result["guardrail_verdict"]["decision"] == "FILTERED_REVIEW_REQUIRED"
        speech_result = pipeline.scan(source)
        spoken = root / "speech.wav"
        run(["espeak-ng", "-s", "140", "-w", str(spoken),
             "Hello friend. This is a fucking test. The video is finished."])
        speech_video = root / "speech.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
             "color=blue:s=320x240:r=25:d=12", "-i", str(spoken),
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
             "-shortest", str(speech_video)])
        profanity = pipeline.scan(speech_video)
        assert any(event["reason"] == "swearing" for event in profanity["events"]), "Whisper did not locate test profanity"
        speech_filtered = pipeline.process(speech_video, root / "speech-filtered.mp4")
        assert speech_filtered["guardrail_verdict"]["removed_seconds"] > 0
        original_scan = pipeline.scan
        # Exercise the complete process method with a controlled positive interval.
        def controlled_scan(path):
            result = original_scan(path)
            if Path(path) == silent:
                result["events"] = [{"start": 2, "end": 4, "reason": "kissing"}]
            return result
        pipeline.scan = controlled_scan
        controlled = pipeline.process(silent, root / "controlled.mp4")
        assert abs(controlled["edit_plan"]["removed_seconds"] - 2.7) < 0.01
        # Any residual detection must remove the render and prevent publication.
        def residual_scan(path):
            result = controlled_scan(path)
            if Path(path) != silent:
                result["events"] = [{"start": 0, "end": 1, "reason": "kissing"}]
            return result
        pipeline.scan = residual_scan
        rejected = root / "rejected.mp4"
        try:
            pipeline.process(silent, rejected)
            raise AssertionError("Residual violation was published")
        except ValueError as exc:
            assert "still contains" in str(exc)
        assert not rejected.exists()
        return {"render": metadata, "no_flagged_frames_survived": True,
                "audio_cut_frequencies": peaks, "residual_violation_rejected": True,
                "spoken_profanity_cut_and_rescan_passed": True,
                "silent_render_passed": True, "model_pipeline_passed": True,
                "audio_scan_passed": True, "audio_events": len(speech_result["events"]),
                "elapsed_seconds": round(time.monotonic() - started, 1),
                "models": result["models"]}


@app.local_entrypoint()
def main(job_id: str = ""):
    print(inspect_existing.remote(job_id) if job_id else check.remote())


@app.function(image=worker_image, cpu=2, memory=8192, timeout=1200,
              volumes={"/media": media})
def inspect_existing(job_id: str):
    """Read-only scan of an existing processed artifact, not its deleted source."""
    import re
    import time
    from filtered_pipeline import FilteringPipeline
    from cut_media import plan_cuts
    if not re.fullmatch("[a-f0-9]{32}", job_id):
        raise ValueError("Invalid job ID")
    started = time.monotonic()
    pipeline = FilteringPipeline()
    result = pipeline.scan(f"/media/jobs/{job_id}/output.mp4")
    plan = plan_cuts(result["duration"], result["events"])
    return {"artifact": "previously processed output, not original",
            "duration": result["duration"], "language": result["language"],
            "sampled_frames": result["sampled_frames"],
            "events": result["events"], "removed_seconds": plan["removed_seconds"],
            "elapsed_seconds": round(time.monotonic() - started, 1)}
