import { motion } from 'framer-motion'

function StatCard({ label, value, tone = 'cyan', icon: Icon, subtitle, trend }) {
  const toneMap = {
    cyan: {
      border: 'border-slate-200 hover:border-sky-300',
      text: 'text-sky-600',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
      glow: 'hover:shadow-sky-100/60',
    },
    violet: {
      border: 'border-slate-200 hover:border-indigo-300',
      text: 'text-indigo-600',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      glow: 'hover:shadow-indigo-100/60',
    },
    rose: {
      border: 'border-slate-200 hover:border-rose-300',
      text: 'text-rose-600',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      glow: 'hover:shadow-rose-100/60',
    },
    emerald: {
      border: 'border-slate-200 hover:border-emerald-300',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      glow: 'hover:shadow-emerald-100/60',
    },
    amber: {
      border: 'border-slate-200 hover:border-amber-300',
      text: 'text-amber-600',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      glow: 'hover:shadow-amber-100/60',
    },
  }

  const selected = toneMap[tone] || toneMap.cyan

  return (
    <motion.article 
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition-all duration-300 ${selected.border} ${selected.glow}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-normal">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl p-2.5 shrink-0 shadow-xs ${selected.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.article>
  )
}

export default StatCard
