import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Play,
  ArrowRight,
  Cpu,
  Layers,
  Sliders,
  EyeOff,
  VolumeX,
  Sparkles,
  Users,
  CheckCircle,
  FileCheck,
  ChevronRight,
  BarChart3,
  Award,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

function LandingPage() {
  const navigate = useNavigate()
  const { demoLogin } = useAuth()

  const handleQuickDemo = (role) => {
    demoLogin(role)
    if (role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  const pipelineSteps = [
    {
      step: '01',
      title: 'Video Demuxing',
      desc: 'OpenCV extracts keyframes at dynamic frame rates while audio tracks are isolated for spectral analysis.',
      icon: Layers,
    },
    {
      step: '02',
      title: 'NudeNet Deep Learning',
      desc: 'PyTorch transfer learning model classifies frames against 18 adult/suggestive classes via ONNX Runtime.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Profile Threshold Gating',
      desc: 'Maturity thresholds (Child: 0.20, Teen: 0.50, Guardian: 0.80) dynamically decide violation trigger points.',
      icon: Sliders,
    },
    {
      step: '04',
      title: 'Dynamic Censorship & XAI',
      desc: '51×51 Gaussian blur is applied to flagged visual regions and an interactive Explainable AI heatmap is produced.',
      icon: Sparkles,
    },
  ]

  const features = [
    {
      title: 'Fine-Grained Profile Policies',
      desc: 'Set custom sensitivity tolerances for individual family members. Child accounts require parental PIN authorization to modify.',
      icon: Users,
      tag: 'Module 1 & 4',
    },
    {
      title: 'Real-Time NudeNet Inference',
      desc: 'High-speed ONNX-accelerated inference achieves frame processing in under 20ms, rendering automated censorship viable.',
      icon: EyeOff,
      tag: 'Module 3: AI Engine',
    },
    {
      title: 'Explainable AI Heatmap',
      desc: 'Inspect color-coded timelines pinpointing exact seconds of detected visual violations, model confidence, and actions taken.',
      icon: BarChart3,
      tag: 'Module 5: XAI Reporting',
    },
    {
      title: 'Admin Governance & Auditing',
      desc: 'Centralized administration dashboard synchronized in real-time with Firestore for reviewing flagged assets and user suspension.',
      icon: ShieldCheck,
      tag: 'Module 4: Admin Portal',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 relative flex items-center justify-center">
              <img src="/logo.png" alt="PurePlay Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              PurePlay
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuickDemo('guardian')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Evaluator Demo (1-Click)</span>
            </button>
            <Link
              to="/login"
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Academic badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-6 backdrop-blur-md">
              <Award className="h-4 w-4" />
              COMSATS University Final Year Project (FYP-1)
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] text-white tracking-tight">
              AI-Powered Video Moderation for <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Child-Safe Media</span>.
            </h1>

            <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
              PurePlay autonomously analyzes uploaded video streams using trained deep learning models. It automatically censors adult nudity, graphic scenes, and profanity while allowing guardians to configure custom age-appropriate tolerance policies.
            </p>

            {/* Quick Evaluator Access Bar */}
            <div className="mt-8 p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-900/40 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Instant Viva & Evaluation Access
                </span>
                <span className="text-[10px] text-slate-400 font-mono">No sign-up needed</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Experience all functional modules instantly with pre-configured roles:
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleQuickDemo('guardian')}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition"
                >
                  <Users className="h-4 w-4" />
                  <span>Launch Guardian View</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('admin')}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-xs font-bold text-violet-300 hover:bg-violet-500/25 active:scale-95 transition"
                >
                  <ShieldCheck className="h-4 w-4 text-violet-400" />
                  <span>Launch Admin Portal</span>
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/signup" className="btn-primary flex items-center gap-2 text-sm">
                <span>Create New Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/gallery"
                className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
              >
                <Play className="h-4 w-4 text-cyan-400" />
                <span>Browse Approved Gallery</span>
              </Link>
            </div>
          </motion.div>

          {/* Hero Interactive Visualization Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">pureplay-nudenet-engine::stream</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ● Real-time Filter ON
                </span>
              </div>

              {/* Mock Media Stream Player */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-4 space-y-4">
                <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden flex flex-col justify-between p-4 border border-slate-800">
                  <div className="flex items-center justify-between z-10">
                    <span className="text-xs font-bold text-white px-2.5 py-1 rounded bg-black/60 backdrop-blur-md">
                      Frame 0482 / 30fps
                    </span>
                    <span className="text-xs font-bold text-rose-400 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 backdrop-blur-md">
                      NSFW Region Detected (94.2%)
                    </span>
                  </div>

                  {/* Simulated Bounding Box Censorship */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-36 border-2 border-dashed border-rose-500 rounded-xl bg-rose-500/10 backdrop-blur-xl flex flex-col items-center justify-center p-3 text-center shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                      <EyeOff className="h-6 w-6 text-rose-400 mb-1" />
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Gaussian Redacted</span>
                      <span className="text-[9px] font-mono text-rose-300">Class: EXPOSED_GENITALIA_F</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Play className="h-3 w-3 fill-cyan-400" />
                      </div>
                      <span className="text-xs font-mono text-slate-400">00:16 / 02:40</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Child Policy Enforced
                    </span>
                  </div>
                </div>

                {/* Heatmap timeline strip */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-300">XAI Violation Timeline</span>
                    <span className="text-[10px] font-mono text-cyan-400">2 triggers mitigated</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
                    <div className="w-[20%] bg-emerald-500/40" />
                    <div className="w-[8%] bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
                    <div className="w-[35%] bg-emerald-500/40" />
                    <div className="w-[7%] bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                    <div className="w-[30%] bg-emerald-500/40" />
                  </div>
                </div>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Audio Stream Clean</p>
                    <p className="text-[10px] text-slate-400">Profanity suppression active</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                    <EyeOff className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Visual Redaction</p>
                    <p className="text-[10px] text-slate-400">Kernel: 51×51 Gaussian</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SDS Multi-Stage Architecture Section */}
      <section className="border-t border-slate-800/80 bg-slate-900/40 py-20 px-6 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              System Architecture & Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
              End-to-End Multi-Modal Filtering Pipeline
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Engineered according to the PurePlay Software Design Specification (SDS), integrating OpenCV, custom PyTorch models, and real-time stateful web sockets.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 relative flex flex-col justify-between hover:border-cyan-500/40 transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-cyan-500/40 group-hover:text-cyan-400 transition">
                      {step.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:scale-110 transition">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Core Functional Modules */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Complete Family Media Control
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Comprehensive role-based isolation, policy enforcement, and auditability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-7 border border-slate-800 flex gap-5 hover:border-slate-700 transition"
                >
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 h-fit">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg">{feat.title}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {feat.tag}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* University Attribution Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-10 px-6 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              P
            </div>
            <div>
              <p className="font-bold text-white">PurePlay Video Filtering Platform</p>
              <p className="text-slate-500">COMSATS University Islamabad • Final Year Project (FYP-1)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleQuickDemo('guardian')}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Evaluator Quick Launch →
            </button>
            <Link to="/login" className="hover:text-white transition">
              Log In
            </Link>
            <Link to="/signup" className="hover:text-white transition">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
