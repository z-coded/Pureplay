import { motion } from 'framer-motion'

function StatCard({ label, value, tone = 'cyan', icon: Icon, subtitle, trend }) {
  const toneMap = {
    cyan: {
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      bg: 'bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-900/40',
      text: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15 text-cyan-300',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.08)]',
    },
    violet: {
      border: 'border-violet-500/30 hover:border-violet-500/50',
      bg: 'bg-gradient-to-br from-violet-500/10 via-slate-900/60 to-slate-900/40',
      text: 'text-violet-400',
      iconBg: 'bg-violet-500/15 text-violet-300',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.08)]',
    },
    rose: {
      border: 'border-rose-500/30 hover:border-rose-500/50',
      bg: 'bg-gradient-to-br from-rose-500/10 via-slate-900/60 to-slate-900/40',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/15 text-rose-300',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.08)]',
    },
    emerald: {
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      bg: 'bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/40',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 text-emerald-300',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    },
  }

  const selected = toneMap[tone] || toneMap.cyan

  return (
    <motion.article 
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-md p-5 transition-all duration-300 ${selected.border} ${selected.bg} ${selected.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <p className="mt-1 text-xs font-semibold text-emerald-400">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl p-2.5 ${selected.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.article>
  )
}

export default StatCard
