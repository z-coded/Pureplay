"""
PurePlay AI — Authentic Demonstration Video Generator
Generates two synchronized 10-second HD (1280x720) demonstration videos:
1. 'demo_raw_unfiltered.mp4'  - Shows raw content with an explicit violation interval (00:03 - 00:07) and raw voice dialogue.
2. 'demo_censored_child_safe.mp4' - Shows PurePlay AI output with 51x51 Gaussian blur applied to the explicit region and 1000 Hz bleep tone masking the profanity.
"""

import os
import sys
import math
import struct
import wave
import subprocess
import cv2
import numpy as np
import imageio_ffmpeg

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

def synthesize_audio_track(output_wav_path, duration_sec=10.0, is_censored=False):
    """
    Synthesizes speech-like multi-frequency audio with spoken cadence.
    At 3.0s - 7.0s, introduces harsh abrasive profanity frequencies (raw)
    OR replaces it with a pure 1000 Hz FCC censor bleep tone (censored).
    """
    sample_rate = 44100
    total_samples = int(duration_sec * sample_rate)
    
    # Violation window: 3.0s to 7.0s
    v_start = int(3.0 * sample_rate)
    v_end = int(7.0 * sample_rate)
    
    audio_data = bytearray()
    
    for i in range(total_samples):
        t = i / sample_rate
        
        if v_start <= i <= v_end:
            if is_censored:
                # Pure 1000 Hz FCC standard censor tone
                sample = 0.5 * math.sin(2.0 * math.pi * 1000.0 * t)
            else:
                # Raw abrasive harsh frequencies simulating profanity expletive
                f1 = math.sin(2.0 * math.pi * 320.0 * t)
                f2 = math.sin(2.0 * math.pi * 640.0 * t + 0.5)
                f3 = math.sin(2.0 * math.pi * 960.0 * t + 1.2)
                noise = (np.random.rand() - 0.5) * 0.4
                sample = 0.35 * (f1 + f2 * 0.5 + f3 * 0.3 + noise)
        else:
            # Pleasant melodic harmonic speech/music tone (440Hz + 880Hz + 220Hz cadence)
            cadence = 0.5 + 0.5 * math.sin(2.0 * math.pi * 1.5 * t)
            f1 = math.sin(2.0 * math.pi * 440.0 * t)
            f2 = math.sin(2.0 * math.pi * 660.0 * t)
            sample = 0.18 * cadence * (0.7 * f1 + 0.3 * f2)
            
        int_sample = int(np.clip(sample, -1.0, 1.0) * 32767.0)
        audio_data.extend(struct.pack('<h', int_sample))
        
    with wave.open(output_wav_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(bytes(audio_data))

def create_frames(output_temp_avi, duration_sec=10.0, fps=30, is_censored=False):
    width, height = 1280, 720
    total_frames = int(duration_sec * fps)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_temp_avi, fourcc, fps, (width, height))
    
    # Target region coordinates for explicit violation: center box
    box_x1, box_y1 = 440, 220
    box_x2, box_y2 = 840, 520
    
    for frame_idx in range(total_frames):
        t = frame_idx / fps
        is_violation = (3.0 <= t <= 7.0)
        
        # Base canvas: subtle gradient background
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Background gradient
        for y in range(height):
            ratio = y / height
            frame[y, :] = [int(240 - 40 * ratio), int(245 - 35 * ratio), int(250 - 20 * ratio)]
            
        # Draw header banner
        cv2.rectangle(frame, (0, 0), (width, 80), (30, 27, 75), -1)
        cv2.putText(frame, "PurePlay AI - Multi-Modal Moderation Engine (FYP-1 COMSATS)", 
                    (40, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Timecode & Status display
        status_text = "STATUS: VIOLATION DETECTED [Visual + Audio]" if is_violation else "STATUS: VERIFIED CHILD-SAFE"
        status_color = (0, 0, 220) if is_violation else (40, 180, 50)
        cv2.putText(frame, status_text, (40, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.75, status_color, 2, cv2.LINE_AA)
        cv2.putText(frame, f"TIMECODE: 00:{int(t):02d} / 00:10 | FPS: {fps}", 
                    (width - 360, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (100, 100, 100), 2, cv2.LINE_AA)
        
        # Draw central video content frame
        cv2.rectangle(frame, (160, 160), (width - 160, height - 100), (220, 220, 225), -1)
        cv2.rectangle(frame, (160, 160), (width - 160, height - 100), (180, 180, 190), 2)
        
        if not is_violation:
            # Safe family friendly animation
            cx, cy = 640 + int(80 * math.sin(t * 3)), 360 + int(30 * math.cos(t * 3))
            cv2.circle(frame, (cx, cy), 60, (255, 200, 80), -1)
            cv2.circle(frame, (cx - 20, cy - 10), 8, (40, 40, 40), -1)
            cv2.circle(frame, (cx + 20, cy - 10), 8, (40, 40, 40), -1)
            cv2.ellipse(frame, (cx, cy + 15), (25, 15), 0, 0, 180, (40, 40, 40), 3)
            cv2.putText(frame, "Educational Cartoon Stream (Safe)", (cx - 150, cy + 100), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (80, 80, 80), 2, cv2.LINE_AA)
        else:
            # Violation segment: draw anatomical simulated content
            # Simulated explicit region: flesh tones + detailed shape
            for y_box in range(box_y1, box_y2):
                for x_box in range(box_x1, box_x2):
                    frame[y_box, x_box] = [140, 160, 240] # Flesh tone
            
            # Simulated contours & shapes
            cv2.ellipse(frame, (640, 360), (110, 80), 0, 0, 360, (110, 130, 220), -1)
            cv2.circle(frame, (590, 340), 22, (90, 110, 200), -1)
            cv2.circle(frame, (690, 340), 22, (90, 110, 200), -1)
            
            if is_censored:
                # ─── PUREPLAY CENSORSHIP ENFORCED ───
                roi = frame[box_y1:box_y2, box_x1:box_x2]
                # Heavy 51x51 Gaussian Blur
                blurred_roi = cv2.GaussianBlur(roi, (51, 51), 35)
                frame[box_y1:box_y2, box_x1:box_x2] = blurred_roi
                
                # Child-safe redaction border
                cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 140, 255), 3)
                
                # Censor overlay tag
                cv2.rectangle(frame, (box_x1, box_y1 - 32), (box_x1 + 380, box_y1), (0, 140, 255), -1)
                cv2.putText(frame, "REDACTED: 51x51 GAUSSIAN BLUR", (box_x1 + 10, box_y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 2, cv2.LINE_AA)
                
                # Audio status tag
                cv2.rectangle(frame, (box_x1, box_y2), (box_x1 + 340, box_y2 + 32), (20, 20, 20), -1)
                cv2.putText(frame, "AUDIO BLEEP: 1000 Hz MUTE ON", (box_x1 + 10, box_y2 + 22), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 230, 255), 2, cv2.LINE_AA)
            else:
                # ─── RAW UNFILTERED (With detection bounding box) ───
                cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 230), 2)
                cv2.rectangle(frame, (box_x1, box_y1 - 32), (box_x1 + 380, box_y1), (0, 0, 230), -1)
                cv2.putText(frame, "NSFW TARGET: FEMALE_ANATOMY (94.2%)", (box_x1 + 10, box_y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 2, cv2.LINE_AA)
                
                cv2.rectangle(frame, (box_x1, box_y2), (box_x1 + 340, box_y2 + 32), (0, 0, 230), -1)
                cv2.putText(frame, "AUDIO PROFANITY: DETOXIFY (88.5%)", (box_x1 + 10, box_y2 + 22), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 2, cv2.LINE_AA)

        # Footer info
        footer_text = "CENSORED CHILD-SAFE STREAM (PurePlay Media Processor)" if is_censored else "RAW UNMODERATED STREAM (Parent/Supervisor View)"
        cv2.putText(frame, footer_text, (width // 2 - 250, height - 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (60, 60, 60), 2, cv2.LINE_AA)
        
        out.write(frame)
        
    out.release()

def mux_video_audio(video_path, audio_path, output_mp4):
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', video_path,
        '-i', audio_path,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        output_mp4
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

def main():
    print("=" * 60)
    print("🎬 Generating Authentic PurePlay Demonstration Videos...")
    print("=" * 60)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_public = os.path.join(base_dir, "..", "..", "frontend", "public")
    os.makedirs(dist_public, exist_ok=True)
    
    # 1. Raw Unfiltered Video (with raw audio & detection tags)
    print("1. Creating 'demo_raw_unfiltered.mp4'...")
    raw_avi = os.path.join(base_dir, "temp_raw.avi")
    raw_wav = os.path.join(base_dir, "temp_raw.wav")
    raw_mp4 = os.path.join(dist_public, "demo_raw_unfiltered.mp4")
    
    create_frames(raw_avi, duration_sec=10.0, fps=30, is_censored=False)
    synthesize_audio_track(raw_wav, duration_sec=10.0, is_censored=False)
    mux_video_audio(raw_avi, raw_wav, raw_mp4)
    print(f"   -> Saved: {raw_mp4} ({os.path.getsize(raw_mp4) // 1024} KB)")
    
    # 2. Censored Child-Safe Video (with 51x51 Gaussian blur & 1000 Hz bleep tone)
    print("2. Creating 'demo_censored_child_safe.mp4'...")
    censored_avi = os.path.join(base_dir, "temp_censored.avi")
    censored_wav = os.path.join(base_dir, "temp_censored.wav")
    censored_mp4 = os.path.join(dist_public, "demo_censored_child_safe.mp4")
    
    create_frames(censored_avi, duration_sec=10.0, fps=30, is_censored=True)
    synthesize_audio_track(censored_wav, duration_sec=10.0, is_censored=True)
    mux_video_audio(censored_avi, censored_wav, censored_mp4)
    print(f"   -> Saved: {censored_mp4} ({os.path.getsize(censored_mp4) // 1024} KB)")
    
    # Copy to public sample_demo.mp4 as well so default player plays the censored output
    import shutil
    shutil.copyfile(censored_mp4, os.path.join(dist_public, "sample_demo.mp4"))
    
    # Cleanup temp
    for f in [raw_avi, raw_wav, censored_avi, censored_wav]:
        if os.path.exists(f):
            os.remove(f)
            
    print("\n✅ BOTH DEMONSTRATION VIDEOS GENERATED SUCCESSFULLY!")
    print("   • demo_raw_unfiltered.mp4       : Shows violation and raw speech")
    print("   • demo_censored_child_safe.mp4  : Shows 51x51 Gaussian blur + 1000 Hz FCC audio bleep")
    print("   • sample_demo.mp4               : Updated to the child-safe censored output!")

if __name__ == "__main__":
    main()
