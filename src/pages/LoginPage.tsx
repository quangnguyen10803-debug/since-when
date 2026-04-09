import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirect = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const err = await login(email.trim(), password)
      if (err) {
        setError(err)
      } else if (redirect) {
        navigate(redirect, { replace: true })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const registerLink = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFF0] px-4">
      <div className="w-full max-w-sm">

        {/* Header block */}
        <div className="mb-6 bg-black px-5 py-4 border-2 border-black" style={{ boxShadow: '6px 6px 0px #FFE500' }}>
          <h1 className="text-2xl font-bold text-[#FFE500] tracking-tight uppercase">Since When</h1>
          <p className="mt-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Track memories with your people</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#FFFFE0] border-2 border-black p-5 space-y-4"
          style={{ boxShadow: '6px 6px 0px #000' }}
        >
          <div>
            <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              className="brutal-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              className="brutal-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-white bg-black border-2 border-black px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn-primary w-full justify-center"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          <p className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
            No account?{' '}
            <Link to={registerLink} className="text-black underline hover:text-gray-600">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
