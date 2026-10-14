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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="h-7 w-7 text-purple-700" />
              User Account Directory
            </h1>
            <span className="badge-slate font-mono text-[10px]">Auth Registry</span>
          </div>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm">
            Search registered guardian accounts, monitor profile distribution, and execute governance actions.
          </p>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered Accounts" value={users.length} icon={Users} subtitle="All platform users" />
        <StatCard label="Active Accounts" value={users.length - suspendedCount} tone="emerald" icon={ShieldCheck} subtitle="In good standing" />
        <StatCard label="Suspended Accounts" value={suspendedCount} tone="rose" icon={ShieldAlert} subtitle="Restricted access" />
        <StatCard label="Media Assets Logged" value={videos.length} tone="violet" icon={Users} subtitle="Firestore documents" />
      </section>

      {/* User Table Card */}
      <section className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="admin-user-search" className="text-xs font-semibold text-slate-700">
              Search Accounts
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="admin-user-search"
                type="search"
                placeholder="Search by email, name or UID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field pl-10 pr-4 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5 md:w-48">
            <span className="text-xs font-semibold text-slate-700">Filter by Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field text-xs cursor-pointer"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active only</option>
              <option value="suspended">Suspended only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">User Profile</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((u) => {
                const displayName = u.display_name || u.displayName || 'Guardian User'
                const joinedDate = u.created_at || u.joinedAt
                const role = u.role || 'guardian'

                return (
                  <tr key={u.id} className="text-slate-700 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="text-xs sm:text-sm font-semibold">{displayName}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs mt-0.5">{u.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {role === 'admin' ? (
                        <span className="badge-slate text-[10px] font-mono text-purple-700 border-purple-200 bg-purple-50">
                          admin
                        </span>
                      ) : (
                        <span className="badge-slate text-[10px] font-mono">
                          guardian
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                      {joinedDate ? new Date(joinedDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.suspended ? (
                        <span className="badge-rose text-[10px]">
                          ● Suspended
                        </span>
                      ) : (
                        <span className="badge-emerald text-[10px]">
                          ● Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSuspend(u)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                          u.suspended
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
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
            <p className="py-12 text-center text-xs text-slate-500">No user accounts found matching the current criteria.</p>
          )}
        </div>
      </section>

      <p className="text-[11px] text-slate-400 font-mono">
        Directory records and suspension flags synchronize directly with Firebase Cloud Firestore.
      </p>
    </div>
  )
}

export default AdminUsersPage
