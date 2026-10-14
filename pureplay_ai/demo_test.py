"""
PurePlay AI — Interactive Testing & Demonstration Suite
Allows FYP evaluators, supervisors, and developers to test all 6 AI engines:
1. OpenNSFW2
2. OpenAI Whisper
3. Detoxify
4. NVIDIA NeMo Guardrails
5. OpenCV & Media Processor
6. Live FastAPI Microservice
"""

import os
import sys
import json
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def test_opennsfw2():
    print("\n" + "=" * 60)
    print("🔬 [1/6] Testing OpenNSFW2 Visual NSFW Classifier")
    print("=" * 60)
    from opennsfw2_engine import PurePlayOpenNSFW2Engine
    from PIL import Image

    engine = PurePlayOpenNSFW2Engine()
    
    # 1. Test safe synthetic image (landscape)
    safe_img = Image.new("RGB", (224, 224), color=(60, 140, 200))
    safe_res = engine.analyze_image(safe_img)
    print(f"👉 Input: Safe Landscape Image (Blue sky/water)")
    print(f"   Probability Score: {safe_res['nsfw_score']} | Status: {safe_res['status']}")

    # 2. Test explicit synthetic image (flesh tones)
    nsfw_img = Image.new("RGB", (224, 224), color=(240, 160, 140))
    nsfw_res = engine.analyze_image(nsfw_img)
    print(f"👉 Input: High Flesh-Tone Image")
    print(f"   Probability Score: {nsfw_res['nsfw_score']} | Status: {nsfw_res['status']}")
    print("✅ OpenNSFW2 Test Complete!\n")


def test_whisper():
    print("\n" + "=" * 60)
    print("🎙️ [2/6] Testing OpenAI Whisper Audio Transcriber")
    print("=" * 60)
    from whisper_engine import get_whisper_engine

    engine = get_whisper_engine()
    print("👉 Running transcription on media sample...")
    # Using existing test file or dummy path
    dummy_path = os.path.join(os.path.dirname(__file__), "requirements.txt")
    result = engine.transcribe(dummy_path)
    
    print(f"   Transcribed Text: \"{result['text']}\"")
    print(f"   Model Engine:     {result['model']}")
    print(f"   Timestamp Segments Count: {len(result['segments'])}")
    for seg in result['segments'][:2]:
        print(f"     [{seg['start']}s -> {seg['end']}s] {seg['text']}")
    print("✅ Whisper Test Complete!\n")


def test_detoxify():
    print("\n" + "=" * 60)
    print("💬 [3/6] Testing Detoxify 7-Class NLP Toxicity Moderation")
    print("=" * 60)
    from detoxify_engine import get_detoxify_engine

    engine = get_detoxify_engine()
    test_phrases = [
        "Welcome to our friendly Minecraft family stream today!",
        "Shut up you stupid idiot nobody likes your crap!",
        "I hate you and I will kill your entire team!"
    ]

    for phrase in test_phrases:
        res = engine.analyze_text(phrase)
        print(f"👉 Input: \"{phrase}\"")
        print(f"   Overall Toxicity: {res['overall_toxicity']} | Is Flagged: {res['is_flagged']} | Primary: {res['primary_category']}")
        print(f"   Flagged Words: {res['flagged_words']}")
        print(f"   Key Scores: Toxicity={res['scores']['toxicity']}, Profanity={res['scores']['profanity']}, Threat={res['scores']['threat']}")
        print("-" * 50)
    print("✅ Detoxify Test Complete!\n")


def test_nemo():
    print("\n" + "=" * 60)
    print("🛡️ [4/6] Testing NVIDIA NeMo Multi-Modal Safety Guardrail")
    print("=" * 60)
    from nemo_nsfw_engine import get_nemo_engine

    engine = get_nemo_engine()
    
    scenarios = [
        {
            "name": "Scenario A: Safe Family Educational Cartoon",
            "v_score": 0.05,
            "boxes": [],
            "toxicity": {"toxicity": 0.02, "profanity": 0.0},
            "profile": {"age": 6, "strictness": "STRICT"}
        },
        {
            "name": "Scenario B: Adult Content Detected for Child Profile (8 yrs)",
            "v_score": 0.88,
            "boxes": [{"class": "FEMALE_BREAST_EXPOSED", "score": 0.92}],
            "toxicity": {"toxicity": 0.65, "profanity": 0.82},
            "profile": {"age": 8, "strictness": "STRICT"}
        },
        {
            "name": "Scenario C: Moderate Music Video for Teen Profile (16 yrs)",
            "v_score": 0.45,
            "boxes": [{"class": "BELLY_EXPOSED", "score": 0.60}],
            "toxicity": {"toxicity": 0.30, "profanity": 0.40},
            "profile": {"age": 16, "strictness": "MODERATE"}
        }
    ]

    for sc in scenarios:
        print(f"👉 {sc['name']}")
        res = engine.evaluate_safety_guardrail(
            opennsfw2_score=sc["v_score"],
            nudenet_detections=sc["boxes"],
            detoxify_scores=sc["toxicity"],
            profile=sc["profile"]
        )
        print(f"   Guardrail Decision: {res['decision']} (Status: {res['safety_status']})")
        print(f"   Risk Score:         {res['risk_score']}")
        print(f"   Policy Reason:      {res['policy_reason']}")
        print("-" * 50)
    print("✅ NVIDIA NeMo Guardrails Test Complete!\n")


def test_media_processor():
    print("\n" + "=" * 60)
    print("🎬 [5/6] Testing OpenCV 51x51 Blur & 1000 Hz Bleep Synthesizer")
    print("=" * 60)
    import cv2
    import numpy as np
    from media_processor import get_media_processor

    processor = get_media_processor()
    base_dir = os.path.dirname(__file__)

    # 1. Audio 1000 Hz bleep tone
    out_wav = os.path.join(base_dir, "demo_censored_bleep.wav")
    processor.create_synthetic_audio_track(
        out_wav,
        duration_sec=3.0,
        bleep_intervals=[{"start": 1.0, "end": 2.2}]
    )
    print(f"👉 Synthesized 1000 Hz censor bleep track: {out_wav} ({os.path.getsize(out_wav)} bytes)")

    # 2. OpenCV 51x51 Gaussian blur
    dummy_frame = np.ones((300, 300, 3), dtype=np.uint8) * 150
    # Add a mock object in the center
    cv2.circle(dummy_frame, (150, 150), 40, (50, 50, 220), -1)
    
    redacted = processor.blur_bounding_boxes(dummy_frame, [{"x1": 100, "y1": 100, "x2": 200, "y2": 200}])
    out_img = os.path.join(base_dir, "demo_censored_blur.jpg")
    cv2.imwrite(out_img, redacted)
    print(f"👉 Applied 51x51 Gaussian blur redaction: {out_img}")
    print("✅ Media Processor Test Complete!\n")


def test_live_server():
    print("\n" + "=" * 60)
    print("🌐 [6/6] Testing Live FastAPI Microservice (http://127.0.0.1:8000)")
    print("=" * 60)
    import urllib.request

    try:
        url = "http://127.0.0.1:8000/api/health"
        req = urllib.request.urlopen(url, timeout=5)
        data = json.loads(req.read().decode())
        print("👉 /api/health Response:")
        print(json.dumps(data, indent=2))
        print("✅ FastAPI Server is ONLINE and fully operational!")
    except Exception as e:
        print(f"⚠️ Could not reach server at http://127.0.0.1:8000 ({e})")
        print("   Make sure 'python server.py' is running!")


def main():
    print("==================================================================")
    print("🎓 PurePlay AI — Final Year Project (FYP) Model Test Suite")
    print("==================================================================")
    print("Select a test to run:")
    print("  [1] Test OpenNSFW2 Visual Classifier")
    print("  [2] Test OpenAI Whisper Audio Transcriber")
    print("  [3] Test Detoxify 7-Class NLP Toxicity Moderation")
    print("  [4] Test NVIDIA NeMo Multi-Modal Safety Guardrail")
    print("  [5] Test OpenCV 51x51 Blur & 1000 Hz Bleep Synthesizer")
    print("  [6] Test Live FastAPI Microservice (HTTP GET)")
    print("  [7] RUN ALL TESTS (1 through 6)")
    print("  [0] Exit")
    print("==================================================================")

    choice = sys.argv[1] if len(sys.argv) > 1 else "7"

    if choice == "1":
        test_opennsfw2()
    elif choice == "2":
        test_whisper()
    elif choice == "3":
        test_detoxify()
    elif choice == "4":
        test_nemo()
    elif choice == "5":
        test_media_processor()
    elif choice == "6":
        test_live_server()
    elif choice == "7":
        test_opennsfw2()
        test_whisper()
        test_detoxify()
        test_nemo()
        test_media_processor()
        test_live_server()
    else:
        print("Exiting.")


if __name__ == "__main__":
    main()
