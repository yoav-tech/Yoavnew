import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function Login() {
  const { user, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e1033 0%, #0f0520 50%, #09090B 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 30% 40%, rgba(124,58,237,0.18) 0%, transparent 60%)' }} />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-base font-display">L</span>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100 font-display tracking-tight">LEADERS</p>
              <p className="text-xs text-zinc-500">Ads Hub</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100 font-display leading-snug">
              Performance<br />
              <span className="text-violet-400">at a glance.</span>
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-xs">
              Unified cross-platform ad analytics. Every metric, every campaign — in one place.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              { icon: '◈', text: 'Meta, Google, TikTok & LinkedIn unified' },
              { icon: '◈', text: 'Real-time ROAS, CPA & funnel metrics' },
              { icon: '◈', text: 'Campaign-level drill-down & hierarchy' },
            ].map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <span className="text-violet-500 mt-0.5 flex-shrink-0">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="flex gap-1">
            {['#1877F2', '#EA4335', '#FE2C55', '#0A66C2'].map((c) => (
              <div key={c} className="w-1 h-1 rounded-full opacity-60" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm font-display">L</span>
            </div>
            <span className="text-sm font-bold text-zinc-100 font-display">LEADERS Ads Hub</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100 font-display tracking-tight">Sign in</h1>
            <p className="text-sm text-zinc-500 mt-1">Welcome back — enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-3.5 py-2.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors mt-2"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
