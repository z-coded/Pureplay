# PurePlay — AI Video Filtering for Child-Safe Media

PurePlay lets a guardian upload a video and get back a filtered copy. Detected nudity, kissing and English profanity are cut out of both the picture and the sound. The guardian then reviews the result and approves it for a child profile's gallery.

## Repository layout

```
.
├── frontend/                 React 19 + Vite + Tailwind web app (Firebase auth + Firestore)
│   ├── src/                  pages, components, context, lib, firebase config
│   ├── public/               static assets and demo videos
│   ├── tests/                node:test unit tests
│   └── deploy*.bat / .ps1    Firebase Hosting and Vercel deploy helpers
│
├── backend/                  Video processing service, deployed on Modal
│   ├── modal_app.py          Modal app definition: "api" + "process_video" worker
│   ├── cloud_api.py          FastAPI upload / job-status / playback API
│   ├── filtered_pipeline.py  NudeNet + VideoMAE (kissing) + Whisper detection
│   ├── cut_media.py          FFmpeg cut planning and rendering
│   ├── speech_policy.py      English profanity vocabulary
│   ├── test_*.py             backend unit tests
│   ├── modal_*_check.py      cloud smoke test / auth config check
│   └── legacy/               Old local FastAPI server (blur + bleep), engines,
│                             training scripts, datasets and checkpoints
│
├── docs/
│   ├── setup/                LOCAL_MODAL_SETUP, CLOUD_DEPLOYMENT, FILTERING_GUIDE
│   ├── design/               PRD, SDS, model audit
│   ├── testing/              Software testing documentation
│   ├── presentation/         Project slides
│   └── reference/            Reference material
│
└── scripts/                  Repo helper scripts (push_to_github.bat)
```

```
Browser (localhost:5173 or Vercel)
   │  Firebase login (email/password or Google)
   ▼
frontend ──upload video──► Modal "api" ──queue──► Modal "process_video" worker
   ▲                                                 │ NudeNet + VideoMAE + Whisper
   └────── poll job status / play filtered MP4 ◄─────┘ FFmpeg cut + re-scan
```

All commands below are run in **PowerShell** from the repository root (`D:\fyp\FYP-1 PROJECT`) unless noted otherwise.

---

## 1. Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Node.js | **20.19+ or 22.12+** (needed by `rolldown-vite`) | Frontend |
| Python | 3.11 recommended | Modal CLI (and the optional legacy backend) |
| Firebase project | Free Spark plan is enough | Login + Firestore |
| Modal account | Free monthly credits are enough for a demo | Video processing |

---

## 2. Run the frontend

```powershell
Set-Location "D:\fyp\FYP-1 PROJECT\frontend"
npm install
npm run dev -- --host localhost
```

Open **http://localhost:5173**. The dev server always uses port 5173 (`strictPort`). If the port is taken, see [Troubleshooting](#8-troubleshooting).

You need Firebase values in `frontend/.env` to log in (section 3). You also need a Modal URL in `frontend/.env.local` to process videos (section 4).

---

## 3. Configure Firebase (`frontend/.env`)

1. Create or open a project at https://console.firebase.google.com/.
2. Go to **Project settings → General → Your apps → Web app** and copy the config values.
3. Go to **Authentication → Sign-in method** and enable **Email/Password** (and **Google** if you want it).
4. Go to **Authentication → Settings → Authorized domains** and make sure `localhost` is in the list.
5. Create a **Firestore Database**. It stores each account's profiles in `users/{uid}`.
6. Copy `frontend/.env.example` to `frontend/.env` and fill it in:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
# Accounts whose email is listed here get the Admin dashboard; everyone else is a Guardian
VITE_ADMIN_EMAILS=you@example.com
```

Restart `npm run dev` whenever you change a `.env` file.

---

## 4. Video processing on Modal

This section sets up real video filtering. [docs/setup/LOCAL_MODAL_SETUP.md](docs/setup/LOCAL_MODAL_SETUP.md) has a more detailed walkthrough.

### 4.1 Install the Modal CLI (one time, at repo root)

```powershell
python -m venv .venv-modal
.\.venv-modal\Scripts\python.exe -m pip install "modal==1.6.2"
.\.venv-modal\Scripts\python.exe -m modal setup      # opens the browser to log in
```

You do **not** need PyTorch, model downloads, Docker or FFmpeg on your PC.

### 4.2 Create the Modal secret

In the Modal dashboard, open **Secrets → Create new secret → Custom**. Name it exactly `pureplay-config` and create it in the `main` environment:

| Key | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Your Firebase **Project ID** |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` (add your Vercel URL later) |
| `ALLOWED_USER_UIDS` | Comma-separated Firebase **User UIDs** that may upload |

Set a budget under **Settings → Usage & Billing** so you stay within the free credits.

### 4.3 Deploy

```powershell
.\.venv-modal\Scripts\python.exe -m modal deploy --env main backend/modal_app.py
```

Copy the **api** URL it prints. It looks like `https://<workspace>--pureplay-ai-api.modal.run`. To check it, open `<api-url>/api/health`. It should return `"status":"online"`.

### 4.4 Point the frontend at Modal (`frontend/.env.local`)

```dotenv
VITE_AI_API_URL=https://<workspace>--pureplay-ai-api.modal.run
VITE_AI_API_MODE=jobs
```

Do not add `/api` or a trailing slash. Restart `npm run dev` after saving.

### 4.5 Use it

1. Sign in with the Firebase account whose UID you allowlisted.
2. Pick the guardian profile and open **Upload**. Upload an MP4 or WebM clip of at most **100 MB and 3 minutes**.
3. Keep the page open while the job runs.
4. Review the filtered video, then choose **I reviewed it — add to child gallery**.
5. Switch to the child profile to see the approved video in the gallery.

If a job fails, check the logs at **Modal → Apps → pureplay-ai → process_video**. For how filtering works and its limits, see [docs/setup/FILTERING_GUIDE.md](docs/setup/FILTERING_GUIDE.md).

---

## 5. Optional: legacy local backend (no Modal)

`backend/legacy/server.py` runs the older blur-and-bleep pipeline locally on `http://127.0.0.1:8000`. It is **not** the deployed pipeline.

```powershell
Set-Location "D:\fyp\FYP-1 PROJECT\backend\legacy"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
pip install openai-whisper imageio-ffmpeg   # used at runtime but missing from requirements.txt
python server.py                            # Swagger UI at http://127.0.0.1:8000/docs
```

For the frontend, remove `frontend/.env.local` (or leave `VITE_AI_API_URL` / `VITE_AI_API_MODE` unset). In dev mode the frontend then calls `http://127.0.0.1:8000` directly. See [backend/legacy/README.md](backend/legacy/README.md) for the training and engine scripts.

---

## 6. Tests and build

Frontend (in `frontend/`):

```powershell
npm run test:auth
node --test tests/moderationVerdict.test.mjs
npm run lint
npm run build          # -> frontend/dist
```

Backend (from the repo root):

```powershell
.\.venv-modal\Scripts\python.exe -m unittest backend.test_cut_media backend.test_cloud_api
.\.venv-modal\Scripts\python.exe -X utf8 -m modal run --env main backend/modal_filter_check.py   # cloud smoke test, uses Modal credits
```

---

## 7. Deploying the frontend (Vercel)

| Vercel setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Env vars | All `VITE_FIREBASE_*`, `VITE_ADMIN_EMAILS`, `VITE_AI_API_URL`, `VITE_AI_API_MODE=jobs` |

After that:

1. Add the Vercel domain to `ALLOWED_ORIGINS` in the Modal secret and redeploy Modal.
2. Add the Vercel domain to Firebase **Authorized domains**.

For a CLI deploy instead, run `frontend\deploy_vercel.bat`. Full details are in [docs/setup/CLOUD_DEPLOYMENT.md](docs/setup/CLOUD_DEPLOYMENT.md).

---

## 8. Troubleshooting

| Problem | Fix |
| --- | --- |
| `Port 5173 is already in use` | A dev server is already running, so just open http://localhost:5173. To restart it: `Get-NetTCPConnection -LocalPort 5173 -State Listen \| % { Stop-Process -Id $_.OwningProcess -Force }` |
| "Firebase is not configured" / login disabled | Fill in `frontend/.env` and restart Vite |
| "Set VITE_AI_API_URL…" on upload | Create `frontend/.env.local` (section 4.4) and restart Vite |
| CORS / network error | The origin must exactly match `ALLOWED_ORIGINS`. Redeploy Modal after editing the secret |
| 401 / 403 from API | Sign in with a real Firebase account and make sure its UID is in `ALLOWED_USER_UIDS` |
| 409 from API | You already have a job running. Wait for it to finish |
| `Secret not found` on deploy | The secret must be named exactly `pureplay-config` and be in the `main` environment |

Processed videos stay in the Modal volume `pureplay-media` until you delete them under **Modal → Volumes → pureplay-media → jobs**.
