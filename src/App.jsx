import React, { useEffect, useState } from 'react'
import './App.css'
import ChatPage from './pages/ChatPage.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { getUser } from './services/api'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ff4d4f', background: '#1a1a1a', height: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error && this.state.error.toString()}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [token, setTokenState] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)

  // Initialize route from hash, defaulting to /register or /chat depending on auth
  const getInitialRoute = () => {
    const hash = window.location.hash.replace('#', '')
    if (hash) return hash
    return localStorage.getItem('token') ? '/chat' : '/register'
  }

  const [route, setRoute] = useState(getInitialRoute())

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#', '') || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Load user data on mount if token exists
  useEffect(() => {
    if (token) {
      getUser().then(userData => {
        if (userData) setUser(userData)
      })
    }
  }, [token])

  useEffect(() => {
    // Determine where to redirect based on auth state
    if (!token) {
      // If not logged in, allow access to /login and /register
      if (route !== '/login' && route !== '/register') {
        window.location.hash = '/register'
      }
    } else {
      // If logged in, redirect to /chat if on public pages
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

  const AuthLayout = ({ children }) => (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1>Ella AI</h1>
            <p>Smart AI Conversation Assistant</p>
          </div>
          {children}
          <div className="auth-copyright">
            © 2026 Ella AI. All rights reserved.
          </div>
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
