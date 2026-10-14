"""
PurePlay — NudeNet Command-Line Interface (CLI)
Quick testing tool for video analysis, frame detection, and video sanitization.
"""

import argparse
import json
import sys
from nudenet_engine import PurePlayNudeNetEngine

def main():
    parser = argparse.ArgumentParser(description="PurePlay NudeNet Video Moderation CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Subcommand: analyze-video
    p_video = subparsers.add_parser("video", help="Analyze video frame-by-frame")
    p_video.add_argument("--input", "-i", type=str, required=True, help="Input video file path")
    p_video.add_argument("--threshold", "-t", type=float, default=0.45, help="Confidence threshold")
    p_video.add_argument("--fps", type=float, default=2.0, help="Frames sampled per second")
    p_video.add_argument("--out", "-o", type=str, default=None, help="Save analysis report JSON")

    # Subcommand: analyze-image
    p_img = subparsers.add_parser("image", help="Analyze single image / frame")
    p_img.add_argument("--input", "-i", type=str, required=True, help="Input image file path")
    p_img.add_argument("--threshold", "-t", type=float, default=0.45, help="Confidence threshold")

    # Subcommand: censor
    p_censor = subparsers.add_parser("censor", help="Blur and redact exposed parts in video")
    p_censor.add_argument("--input", "-i", type=str, required=True, help="Input video path")
    p_censor.add_argument("--output", "-o", type=str, required=True, help="Output blurred video path")
    p_censor.add_argument("--blur", type=int, default=51, help="Blur kernel size (odd integer)")

    args = parser.parse_args()
    engine = PurePlayNudeNetEngine()

    if args.command == "video":
        print(f"[*] Analyzing video: {args.input} at {args.fps} FPS sampling...")
        report = engine.analyze_video(args.input, sample_fps=args.fps, threshold=args.threshold)
        
        print("\n" + "=" * 50)
        print(" MODERATION REPORT")
        print("=" * 50)
        print(f"Status:             {report['status']}")
        print(f"Peak NSFW Score:    {report['overall_nsfw_score']}")
        print(f"Flagged Frames:     {report['flagged_frames']} / {report['analyzed_frames']}")
        print(f"Violation Ratio:    {report['violation_ratio'] * 100:.1f}%")
        print(f"Timeline Segments:  {len(report['timeline'])}")

        if args.out:
            with open(args.out, "w") as f:
                json.dump(report, f, indent=2)
            print(f"[+] Full JSON report saved to: {args.out}")
        else:
            print("\nTimeline Preview:")
            for seg in report["timeline"]:
                conf_str = f"({seg['confidence'] * 100:.0f}%)" if seg.get("confidence") else ""
                print(f"  [{seg['start']:>5.1f}% - {seg['end']:>5.1f}%]  {seg['type'].upper():<6}  {seg['label']} {conf_str}")

    elif args.command == "image":
        print(f"[*] Analyzing image: {args.input}...")
        res = engine.analyze_image(args.input, threshold=args.threshold)
        print(json.dumps(res, indent=2))

    elif args.command == "censor":
        engine.censor_video(args.input, args.output, blur_ksize=args.blur)
        print(f"[+] Censored sanitized video written to: {args.output}")

if __name__ == "__main__":
    main()
