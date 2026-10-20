"""Read-only check of the Firebase project configured in Modal.

Run: python -m modal run --env main modal_auth_check.py
Never prints tokens, user IDs, or private keys.
"""
import modal

app = modal.App("pureplay-auth-check")


@app.function(
    secrets=[modal.Secret.from_name("pureplay-config")],
    cpu=0.125, memory=128, timeout=60,
)
def check():
    import json
    import os
    import urllib.request

    project = os.environ.get("FIREBASE_PROJECT_ID", "")
    result = {
        "firebase_project_id": project,
        "project_has_surrounding_whitespace": project != project.strip(),
        "allowlist_entries": len([uid for uid in os.environ.get("ALLOWED_USER_UIDS", "").split(",") if uid.strip()]),
    }
    try:
        with urllib.request.urlopen(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
            timeout=15,
        ) as response:
            result["google_signing_certificates_available"] = bool(json.load(response))
    except Exception as error:
        result["certificate_error_type"] = type(error).__name__
    print(json.dumps(result))
    return result
