import React, { useEffect, useState, useRef } from 'react'
import Message from './Message'
import InputBox from './InputBox'
import { sendMessage, listConversations } from '../services/api'

export default function ChatWindow({ selectedConvoId, token, onNewConvo }) {
  const [messages, setMessages] = useState([])
  const [showShareToast, setShowShareToast] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Clear messages when selected conversation becomes null (New Chat) or changes
  useEffect(() => {
    if (selectedConvoId === null) {
      setMessages([])
    } else {
      // In a real app, fetch messages for this ID
      // setMessages(fetchMessages(selectedConvoId))
      // For demo, we'll just clear or show a mock message
      setMessages([{ id: Date.now(), role: 'assistant', content: `Restored conversation ${selectedConvoId}. (Mock data)` }])
    }
  }, [selectedConvoId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function addMessage(role, content) {
    setMessages((m) => [...m, { id: Date.now() + Math.random(), role, content }])
  }

  async function handleSend(text, opts = {}) {
    addMessage('user', text)
    const assistantId = Date.now() + Math.random()
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: null, loading: true }])

    // Create new conversation if needed
    let currentConvoId = selectedConvoId
    if (currentConvoId === null) {
      currentConvoId = Date.now()
      // Generate a title from the first message (truncate if long)
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text
      onNewConvo && onNewConvo(currentConvoId, title)
    }

    try {
      if (!token) {
        await new Promise(r => setTimeout(r, 1000))
        const reply = `I received your message: "${text}"\n\nThis is a demo response. Connect to a backend to get real AI responses!`
        setMessages((m) => m.map(msg => msg.id === assistantId ? { ...msg, content: reply, loading: false } : msg))
        return
      }
      const res = await sendMessage(token, text, currentConvoId)
      const reply = res.reply || res.message || JSON.stringify(res)
      setMessages((m) => m.map(msg => msg.id === assistantId ? { ...msg, content: reply, loading: false } : msg))
    } catch (e) {
      setMessages((m) => m.map(msg => msg.id === assistantId ? { ...msg, content: '[Error] ' + e.message, loading: false } : msg))
    }
  }

  function handleFileAnalysis(result) {
    if (result?.error) addMessage('assistant', 'File analysis failed: ' + result.error)
    else addMessage('assistant', 'File analysis: ' + (result.summary || JSON.stringify(result)))
  }

  function handleShare() {
    // Mock share functionality
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    })
  }

  const quickActions = [
    { emoji: '💡', text: 'Generate ideas' },
    { emoji: '📝', text: 'Help me write' },
    { emoji: '🔍', text: 'Analyze data' },
    { emoji: '🎨', text: 'Creative tasks' },
  ]

  return (
    <div className="flex-1 flex flex-col chat-panel relative">
      <header className="chat-header">
        <div className="chat-header-title">
          <div className="chat-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="chat-header-text">
            <h2>{selectedConvoId ? 'Conversation' : 'New Conversation'}</h2>
            <span>AI Assistant ready to help</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleShare} className="share-btn" title="Share conversation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>
          <div className="usage-badge">
            <span className="dot"></span>
            <span>Online</span>
          </div>
        </div>
      </header>

      {showShareToast && (
        <div className="share-toast">
          Link copied to clipboard!
        </div>
      )}

      <main className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="12" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />
              </svg>
            </div>
            <h3>How can I help you today?</h3>
            <p>I'm Ella, your AI assistant. Ask me anything or try one of the suggestions below.</p>
            <div className="quick-actions">
              {quickActions.map((action, i) => (
                <button key={i} className="quick-action" onClick={() => handleSend(action.text)}>
                  <span className="emoji">{action.emoji}</span>
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <Message key={m.id} role={m.role} content={m.content} loading={m.loading} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      <div className="input-area">
        <div className="input-wrapper">
          <InputBox onSend={handleSend} token={token} onFileAnalysis={handleFileAnalysis} />
        </div>
      </div>
    </div>
  )
}
