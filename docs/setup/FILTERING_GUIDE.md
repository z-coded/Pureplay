# Filtered video demo (cuts-v1)

## Use it

1. Start the existing Vite frontend and sign in with your allowlisted Firebase account.
2. Select the guardian profile and open **Upload**.
3. Upload a fresh MP4/WebM clip, up to **100 MB and three minutes**. Speech filtering currently covers English.
4. Keep the page open. Modal scans the source, removes detected intervals from picture and sound, renders MP4, and scans the edited result again.
5. Watch the full filtered output. Expand **Removed scenes and detection limits** to inspect original-video timestamps.
6. If suitable, choose **I reviewed it — add to child gallery**. Until then it stays Pending. Return to **Filtered videos** (`/processed-videos`) to review saved results later.
7. Switch to the child profile and open the gallery. It shows this account's approved, verified filtered outputs.

Old results need re-uploading. Source uploads were deleted after processing, so previous blur/bleep files cannot restore their originals. Failed new jobs do not publish an output; if nothing remains, use a different/shorter clip.

## Actual pipeline

- **NudeNet 3.4.2 / 320n:** checks exposed genitalia, breasts, buttocks and anus at 2 frames/second throughout the video; starting threshold 0.40.
- **VideoMAE Kinetics-400:** supervised action classifier with label 176, `kissing`. Uses 16 frames over four seconds, windows every two seconds, plus a final tail window. Kissing score >=0.10 or top-ranked kissing flags the whole window. These are provisional operating points, not calibrated safety probabilities.
- **Whisper base:** transcribes the first audio track with word timestamps. FFprobe confirms audio exists. Decode errors fail the job rather than masquerading as silence.
- **English vocabulary policy:** whole-word matches across every transcript segment, using word timestamps where available and segment timestamps otherwise. Vocabulary is in `backend/speech_policy.py`; this is not a trained general toxicity model.
- **Cut planner:** expands detections by 0.35 seconds, merges nearby cuts, and removes tiny retained fragments. Records the source-to-output timeline.
- **FFmpeg:** accurately seeks and re-encodes retained intervals, concatenates H.264/AAC MP4, validates duration/audio presence, and decodes the output to detect corruption.
- **Verification:** rescans the output, including new joins. Residual findings fail the job and delete the render. A pass means no residual detections, not proof of safety.

The synthetic “OpenNSFW2”, “Detoxify” and “NeMo” classifiers are not imported by this Modal processing path. Legacy `server.py` routes remain but are not the deployed jobs pipeline.

## Limits and hiccups

- Brief scenes between samples, angles, animation, obscured anatomy and transcription errors can cause misses. Kissing windows can remove innocent surrounding footage. Guardian review remains required.
- English vocabulary is limited; ambiguous words can produce false positives. Other languages, unlisted profanity, violence, drugs and broader age suitability are not fully covered.
- Verification uses the same models and shares their blind spots.
- A read-only scan of an earlier 65.83-second stored output took 76.8 seconds on Modal CPU and proposed 62.53 seconds of cuts, mostly kissing windows. This was not a manual accuracy benchmark and used an already processed artifact.
- One worker runs at a time and scales down when idle. CPU processing, rendering and rescanning take time and consume the existing Modal allowance. No paid inference API is used.
- Approval uses the existing Firebase/local-cache workflow, not separately authenticated server-side child authorization. Media URLs are bearer capabilities: anyone holding one can play it directly. This prototype is not tamper-proof parental control.
- Commercial release needs labeled validation, stronger profile/media authorization, measured thresholds and a licensing review.

## Attribution

VideoMAE: Tong et al., *VideoMAE: Masked Autoencoders are Data-Efficient Learners for Self-Supervised Video Pre-Training*.
[Model card and CC-BY-NC-4.0 license](https://huggingface.co/MCG-NJU/videomae-base-finetuned-kinetics).
Weights are pinned to revision `488eb9a0565f257b32866000305c8178965eb9f6` for this noncommercial FYP demo. Preprocessing/windowing are changed by this integration; weights are not fine-tuned here.

[NudeNet](https://github.com/notAI-tech/NudeNet), [Whisper](https://github.com/openai/whisper), and [FFmpeg](https://ffmpeg.org/ffmpeg.html) provide the other core components.

## Checks and deployment

From the repository root in PowerShell:

```powershell
.\.venv-modal\Scripts\python.exe -m unittest backend.test_cut_media backend.test_cloud_api
.\.venv-modal\Scripts\python.exe -X utf8 -m modal run --env main backend/modal_filter_check.py
.\.venv-modal\Scripts\python.exe -X utf8 -m modal deploy backend/modal_app.py --env main
```

The cloud smoke test checks decoded frame removal, audio-frequency ordering, silent media, model execution, controlled positive cuts, and rejection of residual detections. Its speech synthesizer is installed only in the test image.

In `frontend`:

```powershell
node --test tests/moderationVerdict.test.mjs
npm run test:auth
npm run build
```

No new secrets or API keys are required. Keep the existing `.env.local` API URL and `VITE_AI_API_MODE=jobs`. Health reports `pipeline: cuts-v1`; health alone does not establish model readiness.

## Verified on 2026-10-20

- Deployed to the existing `pureplay-ai` Modal app; the existing global API URL returned `pipeline: cuts-v1`.
- 18 backend unit/API tests, 20 frontend authentication/verdict tests, targeted frontend lint and the production build passed.
- Final Modal smoke test passed in 63.1 seconds: removed video frames were absent, retained audio tones were 440/660 Hz in order, silent rendering worked, synthesized English profanity was detected/cut and rescanned, and residual detections prevented publication.
- The production build retains its existing large-JavaScript-bundle warning.
- No browser-driven end-to-end test or labeled detection-accuracy benchmark was performed. A fresh original-video upload is the next user acceptance test.
