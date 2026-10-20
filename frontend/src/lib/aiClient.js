// Videos go straight to the processing service, never through Vercel Functions.
const configuredMode = import.meta.env.VITE_AI_API_MODE
export const aiBaseUrl = (import.meta.env.VITE_AI_API_URL ||
  (import.meta.env.DEV && configuredMode !== 'jobs' ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '')
export const aiMode = configuredMode ||
  (aiBaseUrl.includes('.modal.run') ? 'jobs' : 'sync')

async function errorMessage(response) {
  const body = await response.json().catch(() => ({}))
  return typeof body.detail === 'string' ? body.detail : `AI request failed (${response.status})`
}

function upload(url, body, token, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const abort = () => xhr.abort()
    const finish = (callback, value) => {
      signal?.removeEventListener('abort', abort)
      callback(value)
    }
    xhr.open('POST', url)
    xhr.timeout = 120000
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100))
    }
    xhr.onload = () => {
      let data
      try { data = JSON.parse(xhr.responseText) } catch {
        finish(reject, new Error('AI server returned an invalid response. Check its URL and logs.'))
        return
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        finish(reject, new Error(typeof data.detail === 'string' ? data.detail : `Upload failed (${xhr.status})`))
      } else {
        finish(resolve, data)
      }
    }
    xhr.onerror = () => finish(reject, new Error('Cannot reach the AI service. Check its URL and allowed origins.'))
    xhr.ontimeout = () => finish(reject, new Error('Upload timed out. Check Modal for an existing job before retrying.'))
    xhr.onabort = () => finish(reject, new DOMException('Upload cancelled', 'AbortError'))
    if (signal?.aborted) {
      reject(new DOMException('Upload cancelled', 'AbortError'))
      return
    }
    signal?.addEventListener('abort', abort, { once: true })
    xhr.send(body)
  })
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Polling cancelled', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, ms)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
}

export async function analyzeVideo({ file, user, onProgress, onStatus, signal }) {
  if (!aiBaseUrl) throw new Error('Set VITE_AI_API_URL in .env.local and restart the frontend, or set it in Vercel and redeploy.')
  let result
  if (aiMode === 'jobs') {
    if (!user?.getIdToken) throw new Error('Sign in with a real Firebase account. Cloud processing is unavailable in demo login mode.')
    const token = await user.getIdToken()
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    const submitted = await upload(`${aiBaseUrl}/api/jobs?extension=${encodeURIComponent(extension)}`,
      file, token, onProgress, signal)
    if (!submitted.job_id) throw new Error('The AI service did not return a job ID.')
    onStatus('Video queued. The cloud worker may take a moment to start.')
    const deadline = Date.now() + 45 * 60 * 1000
    let completed = false
    while (Date.now() < deadline) {
      await delay(5000, signal)
      const response = await fetch(`${aiBaseUrl}/api/jobs/${submitted.job_id}`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }, signal,
      })
      if (!response.ok) throw new Error(await errorMessage(response))
      const job = await response.json()
      if (job.status === 'failed') throw new Error(job.error || 'Cloud processing failed.')
      if (job.status === 'complete') {
        result = job.result
        completed = true
        break
      }
      onStatus(job.status === 'processing'
        ? 'Analyzing video and rendering the processed result. Keep this page open.'
        : 'Video queued. Waiting for the processing worker.')
    }
    if (!completed) throw new Error('Processing exceeded the wait limit. Check the job in Modal before retrying.')
  } else {
    const form = new FormData()
    form.append('file', file)
    result = await upload(`${aiBaseUrl}/api/analyze-video?sample_fps=1.0`, form,
      null, onProgress, signal)
  }
  if (!result?.success || !result.censored_video_url) {
    throw new Error('Processing did not produce a video. The upload has not been approved.')
  }
  return { ...result, censored_video_url: new URL(result.censored_video_url, `${aiBaseUrl}/`).href }
}
