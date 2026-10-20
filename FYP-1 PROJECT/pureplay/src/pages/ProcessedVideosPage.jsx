import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { onUserVideosSnapshot, approveVideo } from '../lib/adminStorage.js'
import VideoModal from '../components/VideoModal.jsx'

export default function ProcessedVideosPage() {
  const { user, activeProfile } = useAuth()
  const [videos, setVideos] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const guardian = activeProfile?.type === 'guardian'
  useEffect(() => onUserVideosSnapshot(user?.uid, setVideos), [user?.uid])
  const visible = videos.filter((video) => video.ai_analysis?.verification_passed &&
    (guardian || video.status === 'Approved'))
  const approve = async (video) => {
    if (!guardian || !window.confirm('Have you watched the entire filtered video and confirmed it is suitable for your child?')) return
    try {
      await approveVideo(video.id)
      setSelected(null)
    } catch (err) { setError(err.message) }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Filtered videos</h1>
      <p className="text-sm text-slate-600">Watch the edited output and review its removed scenes before adding it to the child gallery.</p>
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      {!visible.length && <p>No filtered videos yet. Upload a clip to start.</p>}
      {visible.map((video) => (
        <section key={video.id} className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">{video.title}</h2>
          <p className="text-sm">{Number(video.ai_analysis.removed_seconds).toFixed(1)} seconds removed ? {video.status === 'Approved' ? 'Guardian approved' : 'Awaiting guardian review'}</p>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => setSelected(video)}>Watch filtered video</button>
            {guardian && video.status !== 'Approved' && (
              <button className="btn-secondary" onClick={() => approve(video)}>I reviewed it ? add to child gallery</button>
            )}
          </div>
        </section>
      ))}
      <VideoModal isOpen={Boolean(selected)} onClose={() => setSelected(null)}
        videoUrl={selected?.download_url} title={selected?.title}
        aiAnalysis={selected?.ai_analysis} videoData={selected} />
    </div>
  )
}
