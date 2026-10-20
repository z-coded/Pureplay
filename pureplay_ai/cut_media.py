"""Timestamp planning and real A/V cuts. No ML dependencies or synthetic output."""
import json
import math
import subprocess
import tempfile
from pathlib import Path


def run(command, timeout=600):
    result = subprocess.run(command, capture_output=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f"{command[0]} failed: {result.stderr.decode(errors='replace')[-1600:]}")
    return result.stdout


def probe(path):
    data = json.loads(run(["ffprobe", "-v", "error", "-show_streams",
                           "-show_format", "-of", "json", str(path)], timeout=30))
    videos = [s for s in data["streams"] if s["codec_type"] == "video"]
    if not videos:
        raise ValueError("No video stream found")
    duration = float(videos[0].get("duration") or data["format"].get("duration", 0))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("Video duration is invalid")
    return {"duration": duration, "has_audio": any(
        s["codec_type"] == "audio" for s in data["streams"])}


def plan_cuts(duration, events, padding=0.35, merge_gap=0.4, minimum_keep=0.25):
    """All timestamps refer to the source. Short safe gaps are removed too."""
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("Invalid duration")
    intervals = []
    for event in events:
        start, end = float(event["start"]), float(event["end"])
        if not all(map(math.isfinite, (start, end))) or end < start:
            raise ValueError("Invalid detection interval")
        start, end = max(0, start - padding), min(duration, end + padding)
        if end > start:
            intervals.append({"start": start, "end": end,
                              "reasons": [event["reason"]]})
    merged = []
    for interval in sorted(intervals, key=lambda item: item["start"]):
        if merged and interval["start"] <= merged[-1]["end"] + max(merge_gap, minimum_keep):
            merged[-1]["end"] = max(merged[-1]["end"], interval["end"])
            merged[-1]["reasons"] = sorted(set(merged[-1]["reasons"] + interval["reasons"]))
        else:
            merged.append(interval)
    if merged:
        if merged[0]["start"] < minimum_keep:
            merged[0]["start"] = 0
        if duration - merged[-1]["end"] < minimum_keep:
            merged[-1]["end"] = duration
    keep, cursor = [], 0.0
    for interval in merged:
        if interval["start"] > cursor:
            keep.append({"start": cursor, "end": interval["start"]})
        cursor = interval["end"]
    if cursor < duration:
        keep.append({"start": cursor, "end": duration})
    output_cursor = 0.0
    for interval in keep:
        interval["output_start"] = output_cursor
        output_cursor += interval["end"] - interval["start"]
        interval["output_end"] = output_cursor
    return {"removed_intervals": merged, "kept_intervals": keep,
            "original_duration": duration, "output_duration": output_cursor,
            "removed_seconds": duration - output_cursor}


def render_cuts(source, destination, plan):
    """Re-encode each kept interval, then concatenate identical streams.

    Input-side accurate seeking and the same duration for A/V avoid keyframe-only
    cuts. Per-segment encoding bounds FFmpeg memory on a long cut list.
    """
    if not plan["kept_intervals"] or plan["output_duration"] < 0.5:
        raise ValueError("No playable content remains after filtering")
    metadata = probe(source)
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        for index, interval in enumerate(plan["kept_intervals"]):
            command = ["ffmpeg", "-nostdin", "-v", "error", "-y",
                       "-ss", str(interval["start"]), "-i", str(source),
                       "-t", str(interval["end"] - interval["start"]),
                       "-map", "0:v:0", "-map", "0:a:0?",
                       "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1",
                       "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                       "-pix_fmt", "yuv420p", "-threads", "2"]
            if metadata["has_audio"]:
                command += ["-af", "aresample=async=1:first_pts=0",
                            "-c:a", "aac", "-ar", "48000", "-ac", "2"]
            run(command + [str(root / f"part{index:04d}.mp4")])
        manifest = root / "parts.txt"
        manifest.write_text("\n".join(
            f"file 'part{i:04d}.mp4'" for i in range(len(plan["kept_intervals"]))),
            encoding="utf-8")
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat",
             "-safe", "1", "-i", str(manifest), "-c", "copy", "-movflags",
             "+faststart", str(destination)])
    actual = probe(destination)
    tolerance = max(0.25, 0.08 * len(plan["kept_intervals"]))
    if abs(actual["duration"] - plan["output_duration"]) > tolerance:
        Path(destination).unlink(missing_ok=True)
        raise RuntimeError("Rendered duration does not match the cut plan")
    if actual["has_audio"] != metadata["has_audio"]:
        Path(destination).unlink(missing_ok=True)
        raise RuntimeError("Audio stream was lost during rendering")
    # Decode the whole output to detect corrupt render results.
    run(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-i",
         str(destination), "-f", "null", "-"])
    return actual
