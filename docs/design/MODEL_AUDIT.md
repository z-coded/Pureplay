# Video moderation audit — 2026-10-20

This records the **old pipeline** audit. The subsequent `cuts-v1` implementation
replaces the deployed Modal model path; see [FILTERING_GUIDE.md](../setup/FILTERING_GUIDE.md)
for its behavior, verification and remaining limitations.

## Confirmed from deployed Modal results

Two completed jobs were inspected without downloading the videos:

| Job prefix | Duration | Backend verdict | Visual evidence |
| --- | --- | --- | --- |
| d9f27350 | 65.83 seconds | BLOCKED_VIOLATION / REJECTED | NudeNet flagged 3 of 36 samples; custom visual classifier peak 0.0057 |
| e36849ec | 15.70 seconds | BLOCKED_VIOLATION / REJECTED | NudeNet flagged no samples; custom visual classifier flagged 16 of 16 samples |

These detections have not been compared against manually annotated frames. They do not establish which job contains the reported kissing scene, nor whether the detections are correct.

The frontend ignored `decision` and `safety_status`, substituted a random low NSFW score, and saved `Approved`. It did not persist the guardrail verdict. The player also showed unconditional child-safety claims.

## Implemented frontend correction

- Preserve `ai_analysis`; derive status from the explicit backend verdict.
- Remove invented scores, violation descriptions, and timelines for new uploads.
- Block the shared player and download link for rejected/restricted or unverifiable results.
- Remove unconditional child-safety guarantees.
- Existing database records are not rewritten. Re-upload old entries to store a verifiable verdict. This is a UI correction, not backend media access revocation; existing capability URLs remain usable.

## Model findings and limitations

- **Whisper:** official `tiny` weights load in Modal. One result reported an empty transcript; the other took about 14 seconds to transcribe. Speech recognition is not visual kissing detection. In `whisper_engine.py`, catching any “failed to load audio” exception as silence can hide corrupt audio or decoder failures. Silence should be confirmed with stream probing.
- **NudeNet:** the deployed worker loads the packaged pretrained `320n.onnx` detector. It produced detections, but there is no kissing class in this project's policy mapping. Model loading does not validate bounding boxes or accuracy.
- **“NeMo”:** `nemo_nsfw_engine.py` implements a custom PyTorch fusion network and rule overrides, not an integration with NVIDIA NeMo Guardrails. `train_nemo_nsfw.py` trains on generated numeric vectors. Its metrics are not real-video validation.
- **“OpenNSFW2”:** this repository implements a custom ResNet18 binary classifier. `train_opennsfw2.py` generates colored shapes for both training and validation. Those metrics cannot establish real-world adult-content or kissing detection accuracy.
- **Sampling:** the visual analysis caps sampling at approximately 35 frames, so longer videos have substantial gaps.
- **Audio aggregation:** `server.py` passes only the first Detoxify segment's scores into the guardrail, potentially overlooking later speech.
- **Coverage wording:** the blocked reason describes the proportion of sampled frames as a proportion of runtime; those are not equivalent.

No new kissing detector has been installed, trained, or validated. No backend model changes were deployed in this audit. Proper kissing moderation still requires a model that covers that category, representative labeled positive and negative clips, measured recall/false positives, and checks that redaction covers the full detected interval.

## Verification

Four regression tests cover blocked verdicts with low scores, missing/legacy results, restricted/conflicting verdicts, and clean versus redacted output.
