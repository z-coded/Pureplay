import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { onUserVideosSnapshot } from '../lib/adminStorage.js'
import { Shield, Users, Video, Play, Upload, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import VideoModal from '../components/VideoModal.jsx'

function GuardianDashboardPage() {
  const { profiles, activeProfile, role, user } = useAuth()
  const [userVideos, setUserVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [activeVideo, setActiveVideo] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = onUserVideosSnapshot(user.uid, (items) => {
      setUserVideos(items)
      setLoadingVideos(false)
    })
    return () => unsub()
  }, [user?.uid])

  if (role === 'admin') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-amber-100">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl font-bold">Admin Account Detected</h2>
        </div>
        <p className="mt-1 text-slate-300">
          Logged in with administrator privileges. You have full access to platform operations, flagged queues, user records, and sensitivity thresholds.
        </p>
        <div className="mt-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Go to Admin Control Center
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-cyan-400" />
            Guardian Dashboard
          </h1>
          <p className="mt-1 text-slate-400">
            Welcome, <span className="text-cyan-300">{user?.displayName || user?.email}</span>. Manage family profiles, content policies, and inspect video moderation states.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Media</span>
        </Link>
      </section>

      {/* Stats Overview */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Family Profiles" value={profiles.length} icon={Users} subtitle="Active guardian group" />
        <StatCard label="Child Profiles" value={profiles.filter((p) => p.type === 'child').length} tone="rose" icon={Shield} subtitle="Enforcing strict policies" />
        <StatCard label="My Uploaded Videos" value={userVideos.length} tone="cyan" icon={Video} subtitle="Firestore media catalog" />
      </section>

      {/* Active Profile Card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Active Profile Enforcement
          </h2>
          <Link to="/profiles" className="text-xs text-cyan-400 hover:underline">
            Manage Profiles →
          </Link>
        </div>
        {activeProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Profile Name</span>
              <p className="text-lg font-bold text-white mt-1">{activeProfile.name}</p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Maturity Level</span>
              <p className="text-lg font-bold capitalize text-cyan-400 mt-1">{activeProfile.type}</p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Upload Gate</span>
              <p className="text-lg font-bold mt-1 text-emerald-400">
                {activeProfile.type === 'child' ? (
                  <span className="text-rose-400">Restricted (Child Mode)</span>
                ) : (
                  <span>Allowed</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm py-2">
            No profile currently active. Visit <Link to="/profiles" className="text-cyan-400 underline">Profiles</Link> to create or switch.
          </p>
        )}
      </section>

      {/* User Video Upload History (SDS Module 2 / FR2.4) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="h-5 w-5 text-cyan-400" />
              My Uploaded Media (Real-time Firestore)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Live status of videos submitted under your account.</p>
          </div>
        </div>

        {loadingVideos ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading media records...</div>
        ) : userVideos.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
            <Video className="h-10 w-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No videos uploaded yet</p>
            <p className="text-xs mt-1">Upload a video to see real-time AI processing status and compliance logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Video Title</th>
                  <th className="py-3 px-4 font-medium">Uploaded Date</th>
                  <th className="py-3 px-4 font-medium">AI Status</th>
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {userVideos.map((item) => {
                  const status = item.status || 'Pending'
                  return (
                    <tr key={item.id} className="text-slate-200 hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate">{item.title || item.file_name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 truncate line-clamp-1">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : status === 'Flagged'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          ● {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.download_url && (
                          <button
                            onClick={() =>
                              setActiveVideo({
                                url: item.download_url,
                                title: item.title || item.file_name,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.url}
        title={activeVideo?.title}
      />
    </div>
  )
}

export default GuardianDashboardPage
