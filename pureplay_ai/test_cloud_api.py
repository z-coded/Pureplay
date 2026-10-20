"""API contract tests with fake auth/compute; no model execution or cloud calls."""

import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient

from pureplay_ai.cloud_api import create_app, firebase_verifier, read_json, write_json


class CloudAPITest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.volume = Mock()
        self.submit_job = Mock()
        self.app = create_app(
            self.root, self.volume, self.submit_job,
            lambda token: {"uid": token}, ["https://pureplay.example"], {"alice", "bob"},
        )
        self.client = TestClient(self.app)
        self.headers = {"Authorization": "Bearer alice"}

    def submit(self, content=b"demo bytes", **kwargs):
        return self.client.post("/api/jobs?extension=.mp4", content=content,
                                headers=self.headers, **kwargs)

    def complete(self, job_id):
        directory = self.root / job_id
        (directory / "output.mp4").write_bytes(b"0123456789")
        write_json(directory / "result.json", {"success": True, "guardrail_verdict": {"decision": "SAFE_TO_STREAM"}})
        write_json(directory / "status.json", {"status": "complete"})

    def test_health_does_not_start_worker(self):
        self.assertEqual(self.client.get("/api/health").json()["mode"], "jobs")
        self.submit_job.assert_not_called()

    def test_firebase_project_issuer_and_subject_validation(self):
        verifier = firebase_verifier("pureplay-test")
        claims = {"iss": "https://securetoken.google.com/pureplay-test",
                  "sub": "alice", "auth_time": time.time() - 60}
        with patch("google.oauth2.id_token.verify_firebase_token", return_value=claims) as verify:
            self.assertEqual(verifier("signed-token")["uid"], "alice")
            self.assertEqual(verify.call_args.kwargs["audience"], "pureplay-test")
            for invalid in [{**claims, "iss": "https://other.example"},
                            {**claims, "sub": ""}, {**claims, "auth_time": time.time() + 3600}]:
                verify.return_value = invalid
                with self.assertRaises(ValueError):
                    verifier("signed-token")

    def test_auth_required_and_allowlist_enforced(self):
        self.assertEqual(self.client.post("/api/jobs?extension=.mp4", content=b"a").status_code, 401)
        response = self.client.post("/api/jobs?extension=.mp4", content=b"a",
                                    headers={"Authorization": "Bearer stranger"})
        self.assertEqual(response.status_code, 403)
        self.submit_job.assert_not_called()

    def test_upload_is_committed_before_dispatch(self):
        events = []
        self.volume.commit.side_effect = lambda: events.append("commit")
        self.submit_job.side_effect = lambda _: events.append("spawn")
        response = self.submit()
        self.assertEqual(response.status_code, 202)
        job_id = response.json()["job_id"]
        self.assertEqual(events, ["commit", "spawn"])
        self.assertEqual((self.root / job_id / "input.mp4").read_bytes(), b"demo bytes")
        self.assertEqual(self.client.get(f"/api/jobs/{job_id}", headers=self.headers).json()["status"], "queued")

    def test_one_outstanding_job_per_user(self):
        self.assertEqual(self.submit().status_code, 202)
        self.assertEqual(self.submit().status_code, 409)

    def test_other_user_cannot_read_or_delete_job(self):
        job_id = self.submit().json()["job_id"]
        headers = {"Authorization": "Bearer bob"}
        self.assertEqual(self.client.get(f"/api/jobs/{job_id}", headers=headers).status_code, 404)
        self.assertEqual(self.client.delete(f"/api/jobs/{job_id}", headers=headers).status_code, 404)

    def test_upload_limits_and_invalid_extension(self):
        self.assertEqual(self.submit(content=b"").status_code, 400)
        response = self.client.post("/api/jobs?extension=.exe", content=b"x", headers=self.headers)
        self.assertEqual(response.status_code, 400)
        with patch("pureplay_ai.cloud_api.MAX_UPLOAD_BYTES", 3):
            self.assertEqual(self.submit(content=b"1234").status_code, 413)
            # Exercise streamed limit independently of Content-Length.
            self.assertEqual(self.submit(content=iter([b"12", b"34"])).status_code, 413)
        self.assertEqual(list(self.root.iterdir()), [])
        self.submit_job.assert_not_called()

    def test_playback_requires_token_and_supports_ranges(self):
        job_id = self.submit().json()["job_id"]
        self.complete(job_id)
        response = self.client.get(f"/api/jobs/{job_id}", headers=self.headers)
        url = response.json()["result"]["censored_video_url"]
        self.assertEqual(self.client.get(f"/api/media/{job_id}").status_code, 404)
        self.assertEqual(self.client.get(url).content, b"0123456789")
        partial = self.client.get(url, headers={"Range": "bytes=2-5"})
        self.assertEqual(partial.status_code, 206)
        self.assertEqual(partial.content, b"2345")

    def test_failed_jobs_do_not_return_a_video(self):
        job_id = self.submit().json()["job_id"]
        directory = self.root / job_id
        write_json(directory / "status.json", {"status": "failed", "error": "Renderer failed"})
        response = self.client.get(f"/api/jobs/{job_id}", headers=self.headers).json()
        self.assertEqual(response["status"], "failed")
        self.assertNotIn("result", response)

    def test_expired_job_does_not_block_new_submission(self):
        job_id = self.submit().json()["job_id"]
        path = self.root / job_id / "job.json"
        job = read_json(path)
        job["created_at"] = time.time() - 3600
        write_json(path, job)
        self.assertEqual(self.client.get(f"/api/jobs/{job_id}", headers=self.headers).json()["status"], "failed")
        self.assertEqual(self.submit().status_code, 202)

    def test_delete_removes_completed_files_but_rejects_active_job(self):
        job_id = self.submit().json()["job_id"]
        self.assertEqual(self.client.delete(f"/api/jobs/{job_id}", headers=self.headers).status_code, 409)
        self.complete(job_id)
        self.assertEqual(self.client.delete(f"/api/jobs/{job_id}", headers=self.headers).status_code, 200)
        self.assertFalse((self.root / job_id).exists())

    def test_cors_only_allows_configured_frontend(self):
        def preflight(origin):
            return self.client.options("/api/jobs", headers={
                "Origin": origin, "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            })
        response = preflight("https://pureplay.example")
        self.assertEqual(response.headers["access-control-allow-origin"], "https://pureplay.example")
        self.assertEqual(preflight("https://other.example").status_code, 400)


if __name__ == "__main__":
    unittest.main()
