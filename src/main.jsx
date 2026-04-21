import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (error) {
  console.error('Failed to mount app', error)
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 2rem; color: #e6edf3; font-family: sans-serif;">
        <h1 style="margin-bottom: 0.5rem;">Startup error</h1>
        <p style="opacity: 0.9;">The app failed to initialize. Reload the page.</p>
      </div>
    `
  }
}
