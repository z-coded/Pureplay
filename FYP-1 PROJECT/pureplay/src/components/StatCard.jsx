import { motion } from 'framer-motion'

function StatCard({ label, value, tone = 'cyan', icon: Icon, subtitle, trend }) {
  const toneMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      text: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      glow: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.1)]',
    },
    violet: {
      border: 'border-violet-500/20 hover:border-violet-500/40',
      text: 'text-violet-400',
      iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      glow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.1)]',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      glow: 'hover:shadow-[0_0_25px_rgba(244,63,94,0.1)]',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.1)]',
    },
  }

  const selected = toneMap[tone] || toneMap.cyan

  return (
    <motion.article 
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/60 backdrop-blur-xl p-5 transition-all duration-300 ${selected.border} ${selected.glow}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 font-normal">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl p-2.5 shrink-0 ${selected.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.article>
  )
}

export default StatCard
