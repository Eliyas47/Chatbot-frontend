import React, { useEffect, useState, useRef } from 'react'
import Message from './Message'
import InputBox from './InputBox'
import { getConversationMessages, sendMessage, uploadFile } from '../services/api'
import { t } from '../i18n/translations'

export default function ChatWindow({ selectedConvoId, token, onNewConvo, theme, onToggleTheme, language }) {
  const [messages, setMessages] = useState([])
  const [showShareToast, setShowShareToast] = useState(false)
  const [conversationTitle, setConversationTitle] = useState(t('newConversation', language))
  const [loadingConversation, setLoadingConversation] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    let cancelled = false

    async function loadConversation() {
      if (!selectedConvoId) {
        setConversationTitle(t('newConversation', language))
        setMessages([])
        return
      }

      setLoadingConversation(true)
      setMessages([])

      try {
        const data = await getConversationMessages(token, selectedConvoId)
        if (cancelled) return

        setConversationTitle(data?.title || t('conversation', language))
        setMessages(
          (data?.messages || []).map((msg, index) => ({
            id: msg.id ?? `${selectedConvoId}-${index}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          }))
        )
      } catch (error) {
        if (!cancelled) {
          setConversationTitle(t('conversation', language))
          setMessages([{ id: Date.now(), role: 'assistant', content: `${t('unableToLoadConversation', language)}: ${error.message}` }])
        }
      } finally {
        if (!cancelled) setLoadingConversation(false)
      }
    }

    loadConversation()

    return () => {
      cancelled = true
    }
  }, [selectedConvoId, token, language])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function addMessage(role, content) {
    setMessages((m) => [...m, { id: Date.now() + Math.random(), role, content }])
  }

  async function handleSend(text, opts = {}) {
    const trimmedText = (text || '').trim()
    const attachedFile = opts.file || null

    if (!trimmedText && !attachedFile) return

    if (trimmedText) {
      addMessage('user', trimmedText)
    } else if (attachedFile) {
      addMessage('user', `${t('uploadedFile', language)}: ${attachedFile.name}`)
    }

    const assistantId = Date.now() + Math.random()
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: null, loading: true }])

    let currentConvoId = selectedConvoId

    try {
      if (!token) {
        throw new Error(t('youMustBeSignedIn', language))
      }

      if (attachedFile) {
        const uploadResult = await uploadFile(
          token,
          attachedFile,
          currentConvoId,
          trimmedText || `${t('analyzeFile', language)}: ${attachedFile.name}`
        )

        currentConvoId = uploadResult.conversation_id || currentConvoId
        if (!selectedConvoId && currentConvoId) {
          onNewConvo && onNewConvo(currentConvoId, uploadResult.title || attachedFile.name)
        }

        const reply = uploadResult.summary || uploadResult.analysis || t('fileUploadedSuccessfully', language)
        setMessages((m) => m.map(msg => msg.id === assistantId ? { ...msg, content: reply, loading: false } : msg))
        setConversationTitle(uploadResult.title || conversationTitle)
        return
      }

      const res = await sendMessage(token, trimmedText, currentConvoId)

      if (!selectedConvoId && res.conversation_id) {
        onNewConvo && onNewConvo(res.conversation_id, res.title || trimmedText.slice(0, 40) || t('newChat', language))
      }

      const reply = res.reply || res.message || res.ai_response || JSON.stringify(res)
      setMessages((m) => m.map(msg => msg.id === assistantId ? { ...msg, content: reply, loading: false } : msg))
      if (res.title) setConversationTitle(res.title)
    } catch (e) {
      setMessages((m) => m.map(msg => msg.id === assistantId ? { ...msg, content: '[Error] ' + e.message, loading: false } : msg))
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    })
  }

  const quickActions = [
    { emoji: '💡', text: t('generateIdeas', language) },
    { emoji: '📝', text: t('helpMeWrite', language) },
    { emoji: '🔍', text: t('analyzeData', language) },
    { emoji: '🎨', text: t('creativeTasks', language) },
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
            <h2>{conversationTitle}</h2>
            <span>{t('appTagline', language)}</span>
          </div>
        </div>
        <div className="chat-header-actions flex items-center gap-3">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
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
          <button onClick={handleShare} className="share-btn" title={t('shareConversation', language)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            {t('share', language)}
          </button>
          <div className="usage-badge">
            <span className="dot"></span>
            <span>{t('online', language)}</span>
          </div>
        </div>
      </header>

      {showShareToast && (
        <div className="share-toast">
          {t('linkCopied', language)}
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
            <h3>{t('howCanIHelp', language)}</h3>
            <p>{t('askAnything', language)}</p>
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
            {loadingConversation && messages.length === 0 && (
              <div className="empty-state">
                <h3>{t('loadingConversation', language)}</h3>
              </div>
            )}
            {messages.map((m) => (
              <Message key={m.id} role={m.role} content={m.content} loading={m.loading} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      <div className="input-area">
        <div className="input-wrapper">
          <InputBox onSend={handleSend} language={language} />
        </div>
      </div>
    </div>
  )
}
