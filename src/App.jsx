import React, { useEffect, useState } from 'react'
import './App.css'
import ChatPage from './pages/ChatPage.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { getUser } from './services/api'

const THEME_STORAGE_KEY = 'theme'

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function ThemeToggleButton({ theme, onToggle, className = '' }) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`.trim()}
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          color: 'var(--text-primary)',
          background: 'var(--panel-bg)',
          height: '100vh'
        }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [token, setTokenState] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)

  const getInitialRoute = () => {
    const hash = window.location.hash.replace('#', '')
    if (hash) return hash
    return localStorage.getItem('token') ? '/chat' : '/register'
  }

  const [route, setRoute] = useState(getInitialRoute())

  useEffect(() => {
    const onHash = () =>
      setRoute(window.location.hash.replace('#', '') || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (token) {
      getUser().then(userData => {
        if (userData) setUser(userData)
      })
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      if (route !== '/login' && route !== '/register') {
        window.location.hash = '/register'
      }
    } else {
      if (route === '/login' || route === '/register' || route === '/') {
        window.location.hash = '/chat'
      }
    }
  }, [route, token])

  function setToken(t, userData = null) {
    if (t) {
      localStorage.setItem('token', t)
      setTokenState(t)
      if (userData) setUser(userData)
      window.location.hash = '/chat'
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setTokenState(null)
      setUser(null)
      window.location.hash = '/login'
    }
  }

  function handleUpdateUser(userData) {
    setUser(prev => ({ ...prev, ...userData }))
  }

  function toggleTheme() {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'))
  }

  // ✅ AUTH LAYOUT (Fixed Footer Position)
  const AuthLayout = ({ children }) => (
    <div className="auth-page">
      <ThemeToggleButton theme={theme} onToggle={toggleTheme} className="auth-theme-toggle" />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1>Ella AI</h1>
            <p>Smart AI Conversation Assistant</p>
          </div>

          {children}
        </div>
      </div>

      {/* ✅ Footer BELOW container */}
      <div className="auth-footer">
        <p>
          Already have an account? <a href="#/login">Sign in</a>
        </p>

        <div className="auth-copyright">
          © 2026 Ella AI. All rights reserved.
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (!token) {
      if (route === '/register') {
        return (
          <AuthLayout>
            <Register
              onRegistered={() => window.location.hash = '/login'}
              setToken={(t, u) => setToken(t, u)}
            />
          </AuthLayout>
        )
      }

      return (
        <AuthLayout>
          <Login setToken={(t, u) => setToken(t, u)} />
        </AuthLayout>
      )
    }

    return (
      <div className="app-shell">
        <ChatPage
          token={token}
          user={user}
          onSignOut={() => setToken(null)}
          onUpdateUser={handleUpdateUser}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {renderContent()}
    </ErrorBoundary>
  )
}