import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const register = useAuthStore((s) => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const err = await register(email.trim(), password, name.trim())
      if (err) {
        setError(err)
      } else {
        setDone(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFF0] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 bg-black px-5 py-4 border-2 border-black" style={{ boxShadow: '6px 6px 0px #FFE500' }}>
            <h1 className="text-xl font-bold text-[#FFE500] uppercase tracking-tight">Check your email</h1>
            <p className="mt-1 text-xs font-medium text-gray-300">
              We sent a confirmation link to{' '}
              <span className="font-bold text-[#FFE500]">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
          </div>
          <Link to="/login" className="brutal-btn-primary inline-block">
            Go to sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFF0] px-4">
      <div className="w-full max-w-sm">

        {/* Header block */}
        <div className="mb-6 bg-black px-5 py-4 border-2 border-black" style={{ boxShadow: '6px 6px 0px #FFE500' }}>
          <h1 className="text-2xl font-bold text-[#FFE500] tracking-tight uppercase">Since When</h1>
          <p className="mt-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#FFFFE0] border-2 border-black p-5 space-y-4"
          style={{ boxShadow: '6px 6px 0px #000' }}
        >
          <div>
            <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              className="brutal-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              className="brutal-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              className="brutal-input"
              placeholder="Min. 6 characters"
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
            {loading ? 'Creating account…' : 'Create account →'}
          </button>

          <p className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
            Already have an account?{' '}
            <Link to="/login" className="text-black underline hover:text-gray-600">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
