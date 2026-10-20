import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { aiBaseUrl, analyzeVideo } from '../lib/aiClient.js'
import { createVideoDocument, ensureUserDocument, deleteVideo, approveVideo } from '../lib/adminStorage.js'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, CheckCircle2, AlertCircle, FileVideo, ShieldAlert, X, FileText, Play, Trash2 } from 'lucide-react'
import VideoModal from '../components/VideoModal.jsx'

// SDS FR2.1: Supported formats restricted to .mp4 and .webm, max 100MB
const ALLOWED_EXTENSIONS = ['.mp4', '.webm']
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm']
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function UploadPage() {
  const { activeProfile, user } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [validationError, setValidationError] = useState('')
  
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadState, setUploadState] = useState('idle') // idle, uploading, success, error
  const [uploadedVideoData, setUploadedVideoData] = useState(null)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [aiServerStatus, setAiServerStatus] = useState({ online: false, checking: true, details: null })
  const fileInputRef = useRef(null)

  const uploadController = useRef(null)

  useEffect(() => () => uploadController.current?.abort(), [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const checkAiHealth = async () => {
      try {
        if (!aiBaseUrl) throw new Error('AI URL is not configured')
        const res = await fetch(`${aiBaseUrl}/api/health`, { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setAiServerStatus({ online: true, checking: false, details: data })
          return
        }
      } catch { /* Show an offline state; never switch to a different API. */ }
      if (isMounted) setAiServerStatus({ online: false, checking: false, details: null })
    }
    checkAiHealth()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const validateFile = (file) => {
    if (!file) return 'No file selected.'

    const fileName = file.name.toLowerCase()
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext))
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || hasValidExt

    if (!hasValidExt && !hasValidMime) {
      return 'Invalid file type. SDS requires .mp4 or .webm formats only.'
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds maximum size limit of 100MB (${formatBytes(file.size)}).`
    }

    return ''
  }

  const handleFileSelect = (file) => {
    setValidationError('')
    if (!file) return

    const error = validateFile(file)
    if (error) {
      setValidationError(error)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    // Pre-fill title if empty from filename without extension
    if (!title) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1))
    }
  }

  const handleStartUpload = async (e) => {
    e.preventDefault()
    setValidationError('')

    if (!selectedFile) {
      setValidationError('Please select a video file.')
      return
    }

    const fileError = validateFile(selectedFile)
    if (fileError) {
      setValidationError(fileError)
      return
    }

    // Automatic title generation if left blank
    const autoTitle = title.trim() || selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Uploaded Video'
    const autoDescription = description.trim() || 'Automatically analyzed media'

    const effectiveUser = user || {
      uid: 'demo_guardian_123',
      email: 'guardian@pureplay.dev',
      displayName: 'Guardian Account',
    }

    setUploadState('uploading')
    setProgress(5)
    setStatus('Initializing AI moderation pipeline...')

    const finishUploadAndRegister = async (finalDownloadUrl, aiAnalysisVerdict) => {
      setProgress(95)
      setStatus('Registering video metadata & compliance audit...')

      try {
        await ensureUserDocument({
          uid: effectiveUser.uid,
          email: effectiveUser.email,
          displayName: effectiveUser.displayName,
        })

        const docResult = await createVideoDocument({
          userId: effectiveUser.uid,
          userEmail: effectiveUser.email,
          title: autoTitle,
          description: autoDescription,
          storageUrl: '', // Video is stored on the AI backend, not Firebase Storage.
          downloadUrl: finalDownloadUrl,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || 'video/mp4',
          fileName: selectedFile.name,
          aiAnalysis: aiAnalysisVerdict,
        })

        setProgress(100)
        setUploadedVideoData(docResult)
        setStatus(docResult.status === 'Approved' ? 'Analysis complete. Review the result before sharing.' : 'Analysis complete. This video requires review.')
        setUploadState('success')

        // Automatically launch the player with the censored video
        setPreviewVideo({
          url: finalDownloadUrl || '/sample_demo.mp4',
          title: autoTitle,
          aiAnalysis: aiAnalysisVerdict,
        })
      } catch (err) {
        console.error('Error saving document:', err)
        setStatus('Failed to store metadata: ' + (err?.message || 'Storage error'))
        setUploadState('error')
      }
    }

    uploadController.current = new AbortController()
    try {
      const aiData = await analyzeVideo({
        file: selectedFile, user, signal: uploadController.current.signal,
        onProgress: (percent) => {
          setProgress(Math.max(5, Math.round(percent / 2)))
          setStatus(percent === 100 ? 'Upload complete. Waiting for analysis...' : `Uploading video: ${percent}%`)
        },
        onStatus: (message) => { setProgress(55); setStatus(message) },
      })
      await finishUploadAndRegister(aiData.censored_video_url, aiData.guardrail_verdict)
    } catch (error) {
      if (error.name !== 'AbortError') {
        setStatus(error.message || 'AI processing failed. Please try again.')
        setUploadState('error')
      }
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setTitle('')
    setDescription('')
    setValidationError('')
    setProgress(0)
    setStatus('')
    setUploadedVideoData(null)
    setUploadState('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFileSelect(file)
  }

  return (
    <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <section className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            <UploadCloud className="h-7 w-7 text-indigo-600" />
            Media Upload & AI Scanner
          </h1>
          <span className="badge-indigo font-mono text-[10px]">Processing Pipeline</span>
        </div>
        <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600">
          Upload video content directly to the PurePlay automated moderation pipeline. Assets are screened for visual nudity and profanity before indexing.
        </p>
      </section>

      <section className="glass-card relative overflow-hidden rounded-2xl p-6 sm:p-10">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            {/* Active Profile Info */}
            <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-600">Active Viewing Profile</span>
              </div>
              <span className="text-xs font-bold text-indigo-700 font-mono">
                {activeProfile?.name ?? 'Guardian Account'}
              </span>
            </div>

            {/* AI Microservice Status Badge */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${aiServerStatus.online ? 'bg-emerald-500 animate-pulse' : aiServerStatus.checking ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      AI Microservice: {aiServerStatus.online ? 'Online & Connected' : aiServerStatus.checking ? 'Connecting...' : 'Not Found / Offline'}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${aiServerStatus.online ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {aiServerStatus.online ? 'CONNECTED' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {aiServerStatus.online
                      ? 'Processing service is reachable. Models start when a video is submitted.'
                      : 'Processing service is unavailable. Try again shortly.'}
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {uploadState === 'idle' && (
                <Motion.form
                  key="idle"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onSubmit={handleStartUpload}
                  className="space-y-5"
                >
                  {/* Dropzone */}
                  {!selectedFile ? (
                    <div
                      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-200 ${
                        isDragging
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        className="hidden"
                        type="file"
                        accept=".mp4,.webm"
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      />
                      <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 transition-transform duration-200 group-hover:scale-105">
                        <FileVideo className="h-7 w-7" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">Choose a video file or drag and drop</h3>
                      <p className="mt-1 text-xs text-slate-500">High-speed client validation & local frame sampling</p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-mono">
                        <span className="badge-slate">.MP4</span>
                        <span className="badge-slate">.WEBM</span>
                        <span className="badge-slate">Max 100MB ? 3 minutes ? English speech</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                          <FileVideo className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-sm">{selectedFile.name}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                            {formatBytes(selectedFile.size)} • {selectedFile.type || 'video'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Metadata Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Video Title <span className="text-slate-400 font-normal">(auto-filled from file name if blank)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fun Cartoon Episode"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-field text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Description <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Optional details or context..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field text-xs sm:text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Validation Error Banner */}
                  {validationError && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!selectedFile}
                    className="btn-primary w-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Scan & Play Censored Video</span>
                  </button>
                </Motion.form>
              )}

              {uploadState === 'uploading' && (
                <Motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center py-12 text-center"
                >
                  <div className="relative mb-8 h-32 w-32">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" className="stroke-slate-200" strokeWidth="8" fill="none" />
                      <Motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="stroke-indigo-600"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 283' }}
                        animate={{ strokeDasharray: `${(progress / 100) * 283} 283` }}
                        transition={{ duration: 0.3 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-slate-900">{progress}%</span>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 animate-pulse">{status}</h3>
                  <p className="text-sm text-slate-500">PurePlay Multi-Modal AI: NudeNet • OpenNSFW2 • Whisper • Detoxify • NeMo</p>
                </Motion.div>
              )}

              {uploadState === 'success' && (
                <Motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <Motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </Motion.div>
                  <h3 className="mb-2 text-2xl font-bold text-slate-900">Video Uploaded & Logged!</h3>
                  <p className="mb-6 max-w-md text-sm text-slate-600">
                    Review the edited video before making it available in the child gallery.
                  </p>

                  {uploadedVideoData && (
                    <div className="mb-8 w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Firestore Record</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            uploadedVideoData.status === 'Flagged'
                              ? 'badge-rose'
                              : uploadedVideoData.status === 'Approved'
                              ? 'badge-emerald'
                              : 'badge-amber'
                          }`}
                        >
                          Status: {uploadedVideoData.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{uploadedVideoData.title}</h4>
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{uploadedVideoData.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-500">
                        <div>Size: {formatBytes(uploadedVideoData.file_size)}</div>
                        <div>Type: {uploadedVideoData.mime_type}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    {uploadedVideoData?.ai_analysis?.verification_passed &&
                      uploadedVideoData.status !== 'Approved' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={async () => {
                          if (!window.confirm('Have you watched the entire filtered video and confirmed it is suitable for your child?')) return
                          try {
                            await approveVideo(uploadedVideoData.id)
                            setUploadedVideoData((current) => ({ ...current, status: 'Approved' }))
                          } catch (error) {
                            setStatus('Approval failed: ' + error.message)
                          }
                        }}
                      >
                        I reviewed it — add to child gallery
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewVideo({
                        url: uploadedVideoData?.download_url || '/sample_demo.mp4',
                        title: uploadedVideoData?.title || 'Moderated Video',
                        aiAnalysis: uploadedVideoData?.ai_analysis,
                      })}
                      className="btn-primary flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Watch Moderated Video
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-secondary"
                    >
                      Upload Another Video
                    </button>
                    {uploadedVideoData?.id && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to permanently delete this newly uploaded video?')) {
                            await deleteVideo(uploadedVideoData.id)
                            handleReset()
                          }
                        }}
                        className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center justify-center gap-1.5"
                        title="Delete this uploaded video"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </Motion.div>
              )}

              {uploadState === 'error' && (
                <Motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-12 text-center"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
                    <AlertCircle className="h-10 w-10 text-rose-600" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-slate-900">Upload Failed</h3>
                  <p className="mb-8 max-w-md text-sm text-rose-600 font-medium">{status}</p>
                  {status.includes('ALLOWED_USER_UIDS') && (
                    <div className="mb-6 w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-slate-700">
                      <p className="font-semibold">Signed-in account: {user?.email || 'Firebase user'}</p>
                      <label htmlFor="firebase-upload-uid" className="mt-3 block text-xs font-semibold">
                        Firebase User UID — copy this exact value
                      </label>
                      <input
                        id="firebase-upload-uid"
                        readOnly
                        value={user?.uid || 'Not signed in'}
                        onFocus={(event) => event.target.select()}
                        className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-sm"
                      />
                      <p className="mt-3 text-xs leading-relaxed">
                        To allow this account: In Modal dashboard &gt; <b>Secrets</b> &gt; edit <b>pureplay-config</b> &gt; set <code>ALLOWED_USER_UIDS</code> to this UID (or use <code>*</code> to allow all authenticated accounts in your Firebase project), then redeploy Modal.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleReset}
                    className="btn-secondary"
                  >
                    Try Again
                  </button>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        videoUrl={previewVideo?.url}
        title={previewVideo?.title}
        aiAnalysis={previewVideo?.aiAnalysis || uploadedVideoData?.ai_analysis}
        videoData={uploadedVideoData}
        onDelete={uploadedVideoData?.id ? async () => {
          if (window.confirm('Are you sure you want to delete this video?')) {
            await deleteVideo(uploadedVideoData.id)
            setPreviewVideo(null)
            handleReset()
          }
        } : undefined}
      />
    </Motion.div>
  )
}

export default UploadPage
