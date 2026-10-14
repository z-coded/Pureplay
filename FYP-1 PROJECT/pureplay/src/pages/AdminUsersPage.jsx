import { useEffect, useMemo, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import { onUsersSnapshot, onVideosSnapshot, setUserSuspended } from '../lib/adminStorage.js'
import { Users, Search, ShieldCheck, ShieldAlert } from 'lucide-react'

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    const unsubUsers = onUsersSnapshot((items) => {
      setUsers(items || [])
      setLoading(false)
    })

    const unsubVideos = onVideosSnapshot((items) => {
      setVideos(items || [])
    })

    const timer = setTimeout(() => setLoading(false), 1200)

    return () => {
      unsubUsers()
      unsubVideos()
      clearTimeout(timer)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (status === 'active' && u.suspended) return false
      if (status === 'suspended' && !u.suspended) return false
      if (!q) return true
      const name = (u.display_name || u.displayName || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      return email.includes(q) || name.includes(q) || (u.id || '').toLowerCase().includes(q)
    })
  }, [users, query, status])

  const suspendedCount = users.filter((u) => u.suspended).length

  const toggleSuspend = async (user) => {
    try {
      await setUserSuspended(user.id, !user.suspended)
    } catch (err) {
      console.error('Error updating suspend state:', err)
      alert('Failed to update user suspension status.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="h-8 w-8 text-cyan-400" />
          User Account Directory
        </h1>
        <p className="mt-2 text-slate-400">
          Search and filter registered guardian and admin accounts. Manage suspension states and compliance history.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered Accounts" value={users.length} icon={Users} subtitle="All platform users" />
        <StatCard label="Active Accounts" value={users.length - suspendedCount} tone="cyan" icon={ShieldCheck} subtitle="In good standing" />
        <StatCard label="Suspended Accounts" value={suspendedCount} tone="rose" icon={ShieldAlert} subtitle="Restricted access" />
        <StatCard label="Media Assets Logged" value={videos.length} tone="violet" icon={Users} subtitle="Firestore documents" />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 space-y-2">
            <label htmlFor="admin-user-search" className="text-sm font-medium text-slate-300">
              Search Accounts
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="admin-user-search"
                type="search"
                placeholder="Search by email, name or UID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2 md:w-48">
            <span className="text-sm font-medium text-slate-300">Account Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active only</option>
              <option value="suspended">Suspended only</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 font-medium">User Profile</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Registered Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 text-right font-medium">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((u) => {
                const displayName = u.display_name || u.displayName || 'Guardian User'
                const joinedDate = u.created_at || u.joinedAt
                const role = u.role || 'guardian'

                return (
                  <tr key={u.id} className="text-slate-200 hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-medium text-white">
                      <div>{displayName}</div>
                      <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs">{u.id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {joinedDate ? new Date(joinedDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {u.suspended ? (
                        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/30">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSuspend(u)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          u.suspended
                            ? 'bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30 border border-emerald-500/30'
                            : 'bg-rose-600/20 text-rose-200 hover:bg-rose-600/30 border border-rose-500/30'
                        }`}
                      >
                        {u.suspended ? 'Reinstate Account' : 'Suspend Account'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No user accounts found matching filter.</p>
          )}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Directory and suspensions are synchronized in real-time with Firebase Cloud Firestore.
      </p>
    </div>
  )
}

export default AdminUsersPage
