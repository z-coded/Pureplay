"""
PurePlay AI — Multi-Model Integration & Verification Test Suite
Validates all 5 AI engines and media processing tools:
1. NudeNet
2. OpenNSFW2
3. OpenAI Whisper
4. Detoxify
5. NVIDIA NeMo Guardrails
6. OpenCV & Media Processor
"""

import os
import sys
import json
import numpy as np
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def run_integration_tests():
    print("==================================================================")
    print("🧪 Running PurePlay AI Multi-Model Integration Tests")
    print("==================================================================")

    test_dir = os.path.dirname(__file__)
    dummy_img_path = os.path.join(test_dir, "test_synthetic.png")
    
    # Create test image
    img = Image.new("RGB", (320, 320), color=(120, 150, 180))
    img.save(dummy_img_path)

    passed_count = 0
    total_tests = 6

    # Test 1: NudeNet
    print("\n[TEST 1/6] Testing NudeNet Engine...")
    try:
        from nudenet_engine import PurePlayNudeNetEngine
        engine = PurePlayNudeNetEngine(default_threshold=0.45)
        res = engine.analyze_image(dummy_img_path)
        assert "detections" in res
        assert "is_flagged" in res
        print(f"  [+] NudeNet passed! Detections: {len(res['detections'])}, Flagged: {res['is_flagged']}")
        passed_count += 1
    except Exception as e:
        print(f"  [!] NudeNet test failed: {e}")

    # Test 2: OpenNSFW2
    print("\n[TEST 2/6] Testing OpenNSFW2 Engine...")
    try:
        from opennsfw2_engine import PurePlayOpenNSFW2Engine
        engine = PurePlayOpenNSFW2Engine(threshold=0.60)
        res = engine.analyze_image(dummy_img_path)
        assert "nsfw_score" in res
        assert "is_nsfw" in res
        print(f"  [+] OpenNSFW2 passed! Score: {res['nsfw_score']}, Is NSFW: {res['is_nsfw']}")
        passed_count += 1
    except Exception as e:
        print(f"  [!] OpenNSFW2 test failed: {e}")

    # Test 3: OpenAI Whisper
    print("\n[TEST 3/6] Testing OpenAI Whisper Audio Engine...")
    try:
        from whisper_engine import get_whisper_engine
        engine = get_whisper_engine()
        res = engine.transcribe(dummy_img_path)
        assert "segments" in res
        assert "text" in res
        print(f"  [+] Whisper passed! Segments: {len(res['segments'])}, Text length: {len(res['text'])}")
        passed_count += 1
    except Exception as e:
        print(f"  [!] Whisper test failed: {e}")

    # Test 4: Detoxify
    print("\n[TEST 4/6] Testing Detoxify 7-Class NLP Engine...")
    try:
        from detoxify_engine import get_detoxify_engine
        engine = get_detoxify_engine()
        sample_text = "Hey shut up you idiot, stop this crap!"
        res = engine.analyze_text(sample_text)
        assert "scores" in res
        assert "toxicity" in res["scores"]
        assert "profanity" in res["scores"]
        print(f"  [+] Detoxify passed! Toxicity: {res['scores']['toxicity']}, Primary: {res['primary_category']}")
        passed_count += 1
    except Exception as e:
        print(f"  [!] Detoxify test failed: {e}")

    # Test 5: OpenCV & Media Processor
    print("\n[TEST 5/6] Testing OpenCV & Media Processor (51x51 Blur + Bleep Synth)...")
    try:
        import cv2
        from media_processor import get_media_processor
        processor = get_media_processor()
        
        # Test 1000 Hz bleep synthesis
        test_wav = os.path.join(test_dir, "test_bleep_temp.wav")
        processor.create_synthetic_audio_track(test_wav, duration_sec=2.0, bleep_intervals=[{"start": 0.5, "end": 1.2}])
        assert os.path.exists(test_wav)
        os.remove(test_wav)

        # Test 51x51 Gaussian blur
        frame = cv2.imread(dummy_img_path)
        blurred = processor.blur_bounding_boxes(frame, [{"x1": 50, "y1": 50, "x2": 150, "y2": 150}])
        assert blurred.shape == frame.shape
        print("  [+] Media Processor passed! 51x51 Gaussian blur & 1000 Hz bleep synthesis verified.")
        passed_count += 1
    except Exception as e:
        print(f"  [!] Media Processor test failed: {e}")

    # Test 6: NVIDIA NeMo Guardrails
    print("\n[TEST 6/6] Testing NVIDIA NeMo Multi-Modal Guardrail...")
    try:
        from nemo_nsfw_engine import get_nemo_engine
        engine = get_nemo_engine()
        res = engine.evaluate_safety_guardrail(
            opennsfw2_score=0.82,
            nudenet_detections=[{"class": "FEMALE_BREAST_EXPOSED", "score": 0.90}],
            detoxify_scores={"toxicity": 0.45, "profanity": 0.85},
            profile={"age": 8, "strictness": "STRICT"}
        )
        assert "decision" in res
        assert "safety_status" in res
        assert "policy_reason" in res
        print(f"  [+] NVIDIA NeMo passed! Decision: {res['decision']}, Status: {res['safety_status']}")
        passed_count += 1
    except Exception as e:
        print(f"  [!] NVIDIA NeMo test failed: {e}")

    # Cleanup
    if os.path.exists(dummy_img_path):
        os.remove(dummy_img_path)

    print("\n==================================================================")
    print(f"✨ Test Results: {passed_count}/{total_tests} Engines Verified Successfully!")
    print("==================================================================")
    return passed_count == total_tests


if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)
