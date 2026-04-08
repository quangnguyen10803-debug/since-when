import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await login(email.trim(), password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Since When</h1>
          <p className="mt-1 text-sm text-gray-500">Track memories with your people</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              className="notion-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              className="notion-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="notion-btn-primary w-full disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-gray-500">
            No account?{' '}
            <Link to="/register" className="text-gray-900 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
