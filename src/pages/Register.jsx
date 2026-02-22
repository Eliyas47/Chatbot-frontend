import React, { useState } from 'react'
import { register } from '../services/api'

export default function Register({ onRegistered, setToken }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // Pass email and password (api handles username auto-gen)
      const res = await register(email.trim(), password)
      if (res && res.token) {
        // Successful registration
        onRegistered && onRegistered()
        alert('Account created! Please sign in.')
      } else {
        setError('Registration failed')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    // Simulate Google sign-in with user data
    const googleUser = { username: 'Google User', email: 'user@gmail.com' };
    localStorage.setItem('user', JSON.stringify(googleUser));
    setToken('google-demo-token', googleUser);
  };

  return (
    <>
      <div className="auth-form">
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email </label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <button onClick={handleGoogle} className="google-btn">
          <svg viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.9 0 6.7 1.7 8.3 3.1l6-5.9C34.9 4 30.8 2.5 24 2.5 14.8 2.5 7.3 7.8 4 15.3l7.1 5.5C12.1 15.1 17.6 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.2-.6-4.7H24v9.1h12.6c-.5 2.8-2.1 5.2-4.5 6.8l7.1 5.5c4.2-3.9 6.3-9.6 6.3-16.7z" />
            <path fill="#FBBC05" d="M11.1 29.7c-.9-2.6-.9-5.5 0-8.1L4 15.3c-2.8 5.6-2.8 12.3 0 17.9l7.1-3.5z" />
            <path fill="#34A853" d="M24 46.5c6.2 0 11.4-2 15.2-5.4l-7.1-5.5c-2 1.4-4.6 2.3-8.1 2.3-6.4 0-11.9-5.6-12.9-12.7L4 32.3C7.3 39.8 14.8 45 24 45z" />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="auth-footer">
        Already have an account? <a href="#/login">Sign in</a>
      </div>
    </>
  )
}
