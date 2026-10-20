# PurePlay cloud deployment recommendation

**Current implementation:** see [FILTERING_GUIDE.md](FILTERING_GUIDE.md).
The Modal worker cuts detected kissing, nudity and English swearing intervals,
rescans the output, and requires guardian review before gallery approval.

Researched on October 20, 2026. Requirement: a free monthly allowance is sufficient for an FYP demo; the frontend will be deployed on Vercel and processing must run remotely.

For the initial localhost frontend + Modal backend setup, follow [LOCAL_MODAL_SETUP.md](LOCAL_MODAL_SETUP.md). Vercel is not needed for that workflow.

Recommendation: Vercel for React, Modal for the Python API and processing, and a Modal Volume for demo videos. The new image and video-cut pipeline have been smoke-tested on Modal; detection accuracy still needs validation on representative labeled clips.

## Deploy the included code

### 1. Collect three configuration values

Use the Firebase project already configured for PurePlay:

- **FIREBASE_PROJECT_ID:** Firebase Console > Project settings > General > Project ID. Use the project ID, not the numeric project number or app ID.
- **ALLOWED_USER_UIDS:** Firebase Console > Authentication > Users > copy your account's UID. If there is no account yet, use Add user with email/password and enable Email/Password under Authentication > Sign-in method. You will log into PurePlay with this account. Additional allowed UIDs are comma-separated.
- **ALLOWED_ORIGINS:** Your frontend origin, for example `https://pureplay-demo.vercel.app`. Use the exact domain with `https://`, no path and no trailing slash. If Vercel is not set up yet, deploy the frontend first to obtain its URL. The first frontend deployment can show the API as unavailable until step 5 is complete.

Also add your Vercel hostname (for example `pureplay-demo.vercel.app`, without `https://`) in Firebase Console > Authentication > Settings > Authorized domains.

### 2. Add the Modal Secret

Open the [Modal dashboard](https://modal.com/apps) in the workspace you want to use. Open **Secrets**, choose **Create new secret**, and choose **Custom** if a template is requested. Name it exactly:

```text
pureplay-config
```

Add these three key/value entries, replacing all example values:

```text
FIREBASE_PROJECT_ID = your-firebase-project-id
ALLOWED_ORIGINS = https://your-frontend.vercel.app
ALLOWED_USER_UIDS = your-firebase-user-uid
```

Save the secret in the same Modal environment you will deploy to (use the default `main` environment throughout this guide). These are settings for the backend, not Vercel. You do not need a Firebase service-account JSON file or an OpenAI API key for this setup. Tokens are verified using Google's public signing certificates and the configured Firebase project ID.

Before deploying, open Modal **Settings > Usage & Billing**. Check the actual credits available to your account and configure the Workspace budget to stay within that allowance. Inspect whether the dashboard's limit is before or after credits; if a separate spend-limit field is available, set it to zero for no planned overage. Monitor storage/other charges as well. The supplied worker is CPU-only and does not request a GPU.

References: [Modal Secrets](https://modal.com/docs/guide/secrets), [budgets](https://modal.com/docs/guide/budgets), [Google Firebase token verification](https://google-auth.readthedocs.io/en/latest/reference/google.oauth2.id_token.html).

### 3. Connect this computer to your Modal account

Open the VS Code PowerShell terminal at the repository root:

```powershell
Set-Location 'D:\fyp\FYP-1 PROJECT'
.\.venv-modal\Scripts\python.exe -m modal setup
```

The lightweight `.venv-modal` environment has already been created in this workspace and the Modal SDK installed. The setup command opens a browser authentication flow; sign into the Modal account you just created and choose the same workspace as the secret. Do not paste your login tokens into source files or this chat.

On another computer, create the tooling environment first:

```powershell
python -m venv .venv-modal
.\.venv-modal\Scripts\python.exe -m pip install 'modal==1.6.2'
```

No local PyTorch installation, model downloads, Docker installation or local AI server is required.

### 4. Deploy the backend

Run from the same repository-root terminal:

```powershell
.\.venv-modal\Scripts\python.exe -m modal deploy --env main modal_app.py
```

The file `modal_app.py` is already provided; do not paste its code into a Secret. Modal uploads the Python source/checkpoints and builds the Linux images remotely. The first build downloads PyTorch, the Whisper tiny weights and the other runtime dependencies, so allow time for it to finish.

The deployment defines:

| Resource | Purpose |
| --- | --- |
| App `pureplay-ai` | Your deployed backend |
| Function `api` | Lightweight HTTPS upload/status/playback service |
| Function `process_video` | CPU worker, 2 CPU allocation, 8 GiB memory, 30-minute job timeout |
| Volume `pureplay-media` | Durable input/output files and job metadata |

Both functions have a maximum of one container and scale to zero when idle. There is no separate GPU, Dockerfile or port setting to fill in on the dashboard.

Copy the HTTPS URL printed for **api**. Its format resembles:

```text
https://YOUR-WORKSPACE--pureplay-ai-api.modal.run
```

Use the actual URL printed by Modal. Do not use the dashboard URL. Opening `<your-api-url>/api/health` should return:

```json
{"status":"online","mode":"jobs","service":"PurePlay Cloud API"}
```

This checks the web service; the models initialize when the first video job runs. Use `modal deploy`, not `modal serve`, so the service continues to exist after you close the terminal. See [Modal web deployment](https://modal.com/docs/guide/webhooks).

### 5. Connect Vercel

In Vercel > your project > **Settings > Environment Variables**, add:

```text
VITE_AI_API_URL = https://YOUR-ACTUAL-API-HOST.modal.run
VITE_AI_API_MODE = jobs
```

Set these for Production (and Preview only if you also allow that exact preview origin in the Modal secret). Keep the existing `VITE_FIREBASE_*` values. The project build settings are:

```text
Root Directory: FYP-1 PROJECT/pureplay
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Upload/commit the changed project files to the repository connected to Vercel, including `src/lib/aiClient.js` and the updated `src/pages/UploadPage.jsx`. Redeploy the frontend after setting the variables. Vite embeds these variables at build time.

### 6. First real test

1. Visit the Vercel app and sign in using the real Firebase account whose UID you allowlisted. The simulated demo login cannot authenticate to Modal.
2. Upload a short MP4 with speech, ideally 10-20 seconds and a few MB. Keep the upload page open until processing finishes.
3. In Modal > Apps > `pureplay-ai`, inspect the `process_video` logs. Confirm Whisper loads and the job finishes, rather than relying only on `/api/health`.
4. Play the resulting video. Try seeking and verify audio is preserved/censored as expected. Check the actual transcription in the job's `result.json` in the volume when validating model behavior.
5. Check Usage & Billing for actual resource use. Let the containers scale down, then verify the saved video still plays.

### Troubleshooting and demo limits

| Symptom | Check |
| --- | --- |
| Secret not found during deploy | Exact name `pureplay-config`, correct workspace and `main` environment |
| Missing configuration key | All three secret keys are spelled exactly as shown |
| CORS/network error in the browser | `ALLOWED_ORIGINS` exactly matches the Vercel origin; redeploy Modal after changing the secret |
| 401 response | Real Firebase login, matching project ID; sign out/in if needed |
| 403 response | Signed-in user's UID appears in `ALLOWED_USER_UIDS` |
| 409 response | An earlier video is still queued/processing for that user |
| Processing failed | Open the worker logs; failures are shown as errors, never automatically approved |
| Worker killed or time limit reached | Test a shorter/lower-resolution clip; inspect logs and measured memory before changing allocation |
| Frontend still contacts localhost | Deploy the updated frontend with the two `VITE_AI_*` values and rebuild |
| Storage full | Remove old completed job directories in Modal's `pureplay-media` volume |

This is a deliberately small FYP deployment: uploads are limited to 100 MB, each allowed account can have one outstanding job, the worker processes one job at a time, and admission checks stop new uploads when stored demo files reach roughly 1 GiB. Rendered outputs can take the volume above that admission threshold. Keep the upload page open; automatic recovery of an interrupted browser session is not implemented.

Media URLs contain a random access token so the browser video player can load them. Anyone holding a full playback link can access that video. Do not share those links for private videos. Job-status and delete endpoints require the owning Firebase account. This verifier checks token signatures/claims but does not query Firebase's token-revocation state.

Files persist until deleted. Deleting a vault record currently does not remove its Modal files. After a demo, use Modal > Volumes > `pureplay-media` > `jobs` and delete the completed job folders you no longer need. Do not delete a folder while its job is running. The API also provides authenticated `DELETE /api/jobs/{job_id}` for completed/failed jobs.

To apply backend edits or changed secret values, rerun the deploy command. Do not delete the volume during redeployment if you want existing playback links to keep working.

## Original research and design notes

The sections below record the initial investigation. The deployment instructions above supersede the original preparation checklist and findings about behavior that has since been changed.

## Hosting options checked

| Platform | Current offer and constraints | Fit for PurePlay |
| --- | --- | --- |
| Modal | Starter advertises $30/month of compute credits with no monthly subscription fee. Usage beyond the allowance is billable. GPU use requires a payment method. | Preferred for occasional demo processing. Supports FastAPI and background Python jobs. |
| Oracle Cloud Always Free | Current documentation lists an Ampere ARM allowance equivalent to 2 OCPUs and 12 GB RAM, plus 200 GB of block storage shared with boot volumes. Capacity shortages and idle-instance reclamation are possible. | Alternative for a persistent CPU server; requires VM administration and checking ARM dependency compatibility. |
| Hugging Face Spaces | New Docker/Gradio compute Spaces require a paid plan, except up to two ZeroGPU Gradio Spaces for eligible free personal accounts older than 30 days with verified email. ZeroGPU has quotas and queues. | Possible with a Gradio adaptation; not a free drop-in Docker deployment of the current FastAPI service. |
| Render Free | 512 MB RAM and 0.1 CPU; free services sleep after inactivity. | Too constrained for this multi-model video pipeline in my assessment. |
| Google Colab | Free interactive notebook compute with variable availability. Its restrictions exclude unrelated web-service/media hosting and limit bypassing the notebook UI on free runtimes. | Useful for interactive training and experiments, not the deployed app's persistent backend. |

Sources: [Modal pricing](https://modal.com/pricing), [Modal GPU requirements](https://modal.com/docs/guide/gpu), [Oracle resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [Oracle signup verification](https://www.oracle.com/cloud/free/faq/), [Spaces overview](https://huggingface.co/docs/hub/spaces-overview), [ZeroGPU eligibility](https://huggingface.co/docs/hub/en/spaces-zerogpu), [Render compute plans](https://render.com/docs/compute-plans), [Render free limits](https://render.com/docs/free), [Colab FAQ](https://research.google.com/colaboratory/faq.html).

## Proposed request flow

```text
Browser loads React from Vercel
  -> signs in with existing Firebase Auth
  -> uploads video directly to remote API/storage
  -> submits a processing job; receives a job ID promptly
  -> polls job status

Modal worker
  -> reads uploaded video
  -> runs NudeNet, OpenNSFW2, Whisper, Detoxify and fusion model
  -> renders censored video with OpenCV/FFmpeg
  -> persists output and analysis

Browser
  -> receives completed result and playable HTTPS URL
  -> stores video metadata in existing Firestore
```

Keep large uploads and processing requests off Vercel Functions. The browser can contact the backend directly using the existing `VITE_AI_API_URL` setting.

For Modal, replace the current synchronous video endpoint with job submission/status endpoints. Modal documents a 150-second HTTP request window and specifically notes that its timeout redirect mechanism does not work for cross-origin requests requiring CORS. Merely increasing the frontend's three-minute timeout is insufficient. See [request timeouts](https://modal.com/docs/guide/webhook-timeouts) and [job processing](https://modal.com/docs/guide/job-queue).

## Findings from the actual code

- `FYP-1 PROJECT/pureplay/src/pages/UploadPage.jsx` already reads `VITE_AI_API_URL`, with a localhost fallback. Its health-check failure path also falls back to `/api` on the frontend origin, where the Vercel SPA does not provide the Python service.
- `pureplay_ai/server.py` loads the engines in one process and performs the video pipeline synchronously inside an async route. A separate worker should own heavy processing so status requests remain responsive.
- The backend writes censored videos into the frontend's `public/censored` directory on its own filesystem. A remote worker cannot update Vercel's deployed static assets this way. Outputs need durable remote storage and URLs served by that storage or a persistent backend route.
- The current upload flow records metadata in Firestore; its Firebase Storage imports do not establish that video bytes are uploaded to Firebase Storage.
- `pureplay_ai/requirements.txt` omits `openai-whisper` and `imageio-ffmpeg`, both used by the runtime. Whisper also needs an executable named `ffmpeg` on PATH. The Windows-oriented `ffmpeg.exe` alias in `server.py` is insufficient for a Linux deployment; install system FFmpeg in the remote image.
- Whisper catches load/transcription errors and returns a fixed synthetic transcript. Cloud validation must verify real audio transcription, not just a successful HTTP response.
- The frontend currently marks failed AI requests as approved and plays the original local video. Replace this with an error/pending state before a public demo; failed processing must not be represented as completed moderation.
- Existing trained files can be shipped to the backend without retraining locally. Include external `.onnx.data` files alongside their `.onnx` files. Actual runtime loading differs from the PRD: NudeNet uses its packaged detector by default, and Whisper loads official `tiny` weights rather than the custom checkpoint.
- Some inference paths explicitly use CPU ONNX. Adding a GPU will not automatically accelerate the whole pipeline, including FFmpeg encoding.

## Backend preparation checklist

1. Build a remote Linux image with a compatible Python version, pinned/tested runtime dependencies, FFmpeg and model artifacts. Build and download models in the cloud.
2. Start with one CPU processing worker and a provisional 4-8 GiB memory allocation; measure actual peak memory and processing time. These are starting values, not measured requirements. Trial a small GPU only if measurements justify it.
3. Separate the processing function from HTTP handlers. Add authenticated job submission and polling, with per-user job ownership and a concurrency limit of one for the initial demo.
4. Verify Firebase ID tokens server-side, enforce upload size/type limits on the backend, and restrict CORS to the deployed frontend origin. Keep service credentials in backend secrets.
5. Store uploads, results and job state outside ephemeral container storage. A Modal Volume is a candidate for a small demo, with explicit commit/reload handling and a backend playback route; verify current storage and transfer charges separately. Alternatively use object storage.
6. Configure a Workspace budget in Modal's Usage & Billing settings and inspect how it applies to credits and any storage/transfer charges. Verify the dashboard's effective limit before test runs. Set containers to scale to zero when idle, and avoid periodic health polling that continually wakes the heavy model worker.
7. Replace simulated approval and progress with actual job states. Remove the production localhost and relative `/api` fallback.

Modal references: [FastAPI hosting](https://modal.com/docs/guide/webhooks), [Volumes](https://modal.com/docs/guide/volumes), [budgets](https://modal.com/docs/guide/budgets), [pricing](https://modal.com/pricing).

Firebase Storage requires the Blaze billing plan as of February 3, 2026, although eligible no-cost allowances remain. Keeping Firebase Auth/Firestore does not require choosing Firebase Storage for video files. See [Firebase's storage billing FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

## Vercel configuration

Import the Git repository into Vercel and use these settings after the remote backend is working:

| Setting | Value |
| --- | --- |
| Root Directory | `FYP-1 PROJECT/pureplay` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `VITE_AI_API_URL=https://<actual-backend-host>` |

Use the base origin without a trailing slash or `/api` suffix; current frontend code appends `/api/...`. Add the existing `VITE_FIREBASE_*` values used by `src/firebase/config.js`, and add the deployed Vercel domain to Firebase Auth's authorized domains. Redeploy after changing build-time variables.

The existing `vercel.json` already rewrites SPA routes to `index.html`. Vite's local development proxy does not run on the deployed static site. Never put backend credentials or Modal tokens in a `VITE_` variable: those values are exposed to browsers. References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vite environment variables](https://vite.dev/guide/env-and-mode).

## Remote acceptance checks

No local model execution is necessary for these checks:

1. Deploy the backend and confirm actual model readiness; the existing health response uses hard-coded loaded labels and is insufficient on its own.
2. Submit a short video with recognizable speech. Confirm real transcription, analysis, output playback and audio/video synchronization.
3. Submit a job that exceeds 150 seconds and verify that polling survives without a single long HTTP response.
4. Restart/scale down the worker and confirm completed output remains playable.
5. Simulate a failed job and verify the frontend shows failure without approving or presenting the original as censored.
6. Check access controls using two accounts and reject oversized uploads server-side.
7. Record wall time, peak memory and dashboard cost for representative clips. Estimate monthly demo usage from those measurements; do not assume a video count from the advertised credits alone.

Your computer only needs to edit/upload code and use the browser. Vercel performs the frontend build; Modal performs the heavy processing. Account setup, billing limits, implementation and remote validation remain to be completed before this design is deployable.
