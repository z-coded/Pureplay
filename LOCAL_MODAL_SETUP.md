# Local PurePlay frontend with Modal processing

For the current scene-cutting behavior and guardian-review steps, see
[FILTERING_GUIDE.md](FILTERING_GUIDE.md). No new Modal secrets are needed.

Your browser and Vite frontend run on this computer at `http://localhost:5173`. The video models and rendering run on Modal. Vercel is not needed yet.

The deployment files and lightweight Modal CLI environment are already prepared. Firebase variables are present in `FYP-1 PROJECT/pureplay/.env`. A new ignored `.env.local` selects cloud job processing and has an empty API URL for you to fill in after deployment. Existing Firebase values remain in `.env`.

## 1. Sign the CLI into Modal

Open a PowerShell terminal in VS Code. Run:

```powershell
Set-Location 'D:\fyp\FYP-1 PROJECT'
.\.venv-modal\Scripts\python.exe -m modal setup
```

Open the browser authorization link printed by the command if it does not open automatically. Sign into your existing Modal account and approve the CLI connection. Wait for the terminal to report success. Use the same Modal workspace for the following steps.

The SDK is already installed. Do not install the AI requirements or run `pureplay_ai/server.py` on this computer.

## 2. Find your Firebase project and login account

Open https://console.firebase.google.com/ and select the project used by PurePlay. You can compare its ID with `VITE_FIREBASE_PROJECT_ID` in `FYP-1 PROJECT/pureplay/.env`.

1. Open Project settings (gear icon) > General and copy the **Project ID**.
2. Open Authentication > Sign-in method. Enable **Email/Password** if it is not already enabled.
3. Open Authentication > Users. If you already have a login account, use it. Otherwise choose **Add user** and create an email/password account.
4. Copy that account's **User UID**. This is not your email address or the Firebase Project ID.
5. Open Authentication > Settings > Authorized domains. Add **localhost** if absent.

Use this real email/password account when you test the app. The simulated demo login cannot authenticate to Modal. The passwords stay in Firebase; they do not go in the Modal secret.

## 3. Add the Modal settings

Open https://modal.com/apps, select your workspace and the **main** environment, then open **Secrets > Create new secret**. Choose the **Custom** template if prompted.

Name the secret exactly **pureplay-config**. Add:

| Key | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | The Project ID from step 2 |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` |
| `ALLOWED_USER_UIDS` | Your User UID from step 2 |

Save it. Use no quotes around the values in the dashboard. You do not need a Firebase service-account JSON key, OpenAI API key, Docker setting or port setting.

Open Modal Settings > Usage & Billing, check your account's actual credit allowance, and configure a Workspace budget within the allowance. Check whether its displayed limit applies before or after credits. If a separate spend-limit control is offered, set it to zero to avoid planned overage. The included worker is CPU-only, allows one worker container and scales to zero when idle; storage also needs monitoring.

## 4. Deploy the processing service

In the same PowerShell terminal at the repository root, run:

```powershell
.\.venv-modal\Scripts\python.exe -m modal deploy --env main modal_app.py
```

Keep the terminal open until deployment finishes. The first build installs the ML libraries and downloads Whisper on Modal's servers. No model processing runs locally.

Modal creates the `pureplay-ai` app, its `api` and `process_video` functions, and the `pureplay-media` volume. Copy the HTTPS URL printed for **api**, resembling:

```text
https://YOUR-WORKSPACE--pureplay-ai-api.modal.run
```

Use the actual generated URL, not the example above and not the dashboard URL. Open that URL with `/api/health` appended. It should return JSON containing `"status":"online"` and `"mode":"jobs"`. This verifies the API; real model loading is tested by an upload in step 7.

## 5. Put the API URL in the local frontend

Open `FYP-1 PROJECT/pureplay/.env.local` in VS Code. Replace its empty URL value:

```dotenv
VITE_AI_API_URL=https://YOUR-ACTUAL-API-HOST.modal.run
VITE_AI_API_MODE=jobs
```

Use no `/api`, `/api/health` or trailing slash. Keep the Firebase variables in `.env`. Vite loads `.env.local` over `.env`, so the old localhost backend URL in `.env` will not be used.

## 6. Start or restart the frontend

In a second PowerShell terminal:

```powershell
Set-Location 'D:\fyp\FYP-1 PROJECT\FYP-1 PROJECT\pureplay'
npm run dev -- --host localhost
```

Open **http://localhost:5173**. Leave the Vite terminal running while using the app. After changing `.env.local`, restart Vite (Ctrl+C followed by the same command). If a frontend instance was already started, stop that instance before starting another. The server now requires port 5173 rather than silently choosing a different port that would not match CORS.

## 7. Verify processing

1. Sign in using the Firebase account whose UID is in the Modal secret.
2. Open Upload. The API should show as reachable after the page loads.
3. Upload a short MP4 with audible speech (10-20 seconds, a few MB).
4. Keep the page open while the cloud worker initializes and processes the video.
5. In Modal > Apps > pureplay-ai > process_video, inspect logs if processing fails or seems stuck.
6. Play the processed output and check both video and audio. Monitor Usage & Billing.

The initial upload may take longer because the worker starts and loads models. AI failures are reported instead of approving the unprocessed input. A healthy API alone does not establish that inference succeeds.

## Common issues

- **Token missing in the terminal:** repeat `modal setup`, using the same workspace as the secret.
- **Secret not found:** check the name `pureplay-config`, all three keys, and the `main` environment.
- **401:** sign into a real Firebase account; check the matching Project ID.
- **403:** check the account UID in `ALLOWED_USER_UIDS`.
- **CORS/network error:** use `http://localhost:5173`; check the exact origins above. Redeploy Modal after editing the secret.
- **Frontend unavailable:** start Vite, or check whether another process already occupies port 5173.
- **API unavailable:** check the generated backend URL and restart Vite after saving `.env.local`.
- **Worker failure:** read Modal's worker logs; start with a short clip with speech.

Processed media remains in the Modal Volume until deleted. Removing a vault entry currently does not remove the corresponding Modal files. After testing, remove unneeded completed job folders through Modal > Volumes > pureplay-media > jobs. Do not remove a job while it is running. Full playback URLs act as access links; anyone who has one can play that video.

Local checks cover the API contract and frontend build. Authentication to your real Firebase project, the remote image build and real model inference must still be checked after deployment.
