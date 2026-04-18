import React, { useState, useEffect } from 'react'
import { createConversation, deleteConversation, listConversations, updateUser } from '../services/api'
import { t } from '../i18n/translations'

export default function Sidebar({ user, onSignOut, onUpdateUser, selectedConvoId, onSelectConvo, token, refreshTrigger, theme, onToggleTheme, language, onLanguageChange }) {
  const [convos, setConvos] = useState([])
  const [query, setQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false) // New state for Help menu
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Settings form state
  const [settingsName, setSettingsName] = useState('')
  const [settingsEmail, setSettingsEmail] = useState('')
  const [notifications, setNotifications] = useState(false)
  const [settingsLanguage, setSettingsLanguage] = useState(language || 'en')

  // Update settings form when user changes
  useEffect(() => {
    if (user) {
      setSettingsName(user.username || '')
      setSettingsEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    setSettingsLanguage(language || 'en')
  }, [language])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    listConversations(token, query)
      .then((res) => {
        if (!cancelled && Array.isArray(res)) setConvos(res)
      })
      .catch(() => { })

    return () => {
      cancelled = true
    }
  }, [token, refreshTrigger, query])

  async function newConvo() {
    onSelectConvo(null)

    if (!token) return

    try {
      const created = await createConversation(token, t('newChat', language))
      const newConversation = {
        id: created?.conversation_id,
        title: created?.title || t('newChat', language),
      }

      if (newConversation.id) {
        setConvos((current) => [newConversation, ...current.filter((c) => c.id !== newConversation.id)])
        onSelectConvo(newConversation.id)
      }
    } catch (error) {
      console.error('Failed to create conversation', error)
    }
  }

  async function deleteConvo(id) {
    try {
      await deleteConversation(token, id)
      setConvos((current) => current.filter((c) => c.id !== id))
      if (selectedConvoId === id) onSelectConvo(null)
    } catch (error) {
      console.error('Failed to delete conversation', error)
    }
  }

  async function handleSaveSettings() {
    const updated = await updateUser({ username: settingsName, email: settingsEmail })
    if (onUpdateUser) onUpdateUser(updated)
    if (onLanguageChange) onLanguageChange(settingsLanguage)
    setShowSettings(false)
  }

  // Get display info from user prop
  const displayName = user?.username || 'User'
  const displayEmail = user?.email || 'user@example.com'

  const helpItems = [

    { icon: '❓', text: 'Help center', action: () => alert('Opening Help Center...') },
    { icon: '📝', text: 'Release notes', action: () => alert('Latest Version: v1.0.1\n- Added Help Menu\n- Improved UI') },
    { icon: '📄', text: 'Terms & policies', action: () => alert('Opening Terms & Policies...') },
    { icon: '🐛', text: 'Report Bug', action: () => window.open('mailto:support@ella.ai?subject=Bug Report') },
    { icon: '⬇️', text: 'Download apps', action: () => alert('Download page coming soon!') },
    { icon: '⚡', text: 'Keyboard shortcuts', action: () => setShowShortcuts(true) },
  ]

  const handleHelpAction = (action) => {
    setShowProfileMenu(false);
    setShowHelpMenu(false);
    action();
  }

  return (
    <aside className="sidebar w-72 flex-shrink-0 flex flex-col">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="sidebar-logo-text">{t('appName', language)}</span>
        </div>

        <button onClick={newConvo} className="new-chat-btn">
          <span className="icon">+</span>
          <span>{t('newChat', language)}</span>
        </button>
      </div>

      <div className="search-box">
        <input
          className="search-input"
          placeholder={t('searchConversations', language)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="conversation-list">
        {convos.map(c => (
          <div
            key={c.id}
            onClick={() => onSelectConvo(c.id)}
            className={`conversation-item ${selectedConvoId === c.id ? 'active' : ''}`}
          >
            <div className="conversation-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="conversation-title">{c.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteConvo(c.id); }}
              className="conversation-delete"
              title={t('deleteConversation', language) || 'Delete conversation'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
        {convos.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm">{t('noConversationsYet', language)}</p>
            <p className="text-xs mt-1 opacity-60">{t('startNewChat', language)}</p>
          </div>
        )}
      </div>

      {/* User Profile Section */}
      <div className="sidebar-footer">
        <div className="profile-section">
          <div
            className="profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-email">{displayEmail}</span>
            </div>
            <svg className={`profile-chevron ${showProfileMenu ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {showProfileMenu && (
            <div className="profile-menu">
              <button className="profile-menu-item" onClick={() => { setShowSettings(true); setShowProfileMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {t('settings', language)}
              </button>

              {/* Help & FAQ with Submenu */}
              <div
                className="profile-menu-item-wrapper"
                onMouseEnter={() => setShowHelpMenu(true)}
                onMouseLeave={() => setShowHelpMenu(false)}
              >
                <button
                  className="profile-menu-item"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {t('helpFaq', language)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.5 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Hover Submenu */}
                {showHelpMenu && (
                  <div className="help-submenu">
                    {helpItems.map((item, i) => (
                      <button
                        key={i}
                        className="help-submenu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHelpAction(item.action);
                        }}
                      >
                        <span className="help-icon">{item.icon}</span>
                        {item.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="profile-menu-divider"></div>
                <button className="profile-menu-item logout" onClick={onSignOut}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('logOut', language)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>{t('settings', language)}</h2>
              <button className="settings-close" onClick={() => setShowSettings(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h3>{t('profile', language)}</h3>
                <div className="settings-item">
                  <label>{t('displayName', language)}</label>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder={t('yourName', language)}
                  />
                </div>
                <div className="settings-item">
                  <label>{t('email', language)}</label>
                  <input
                    type="email"
                    value={settingsEmail}
                    onChange={(e) => setSettingsEmail(e.target.value)}
                    placeholder={t('yourEmail', language)}
                  />
                </div>
                <div className="settings-item">
                  <label>{t('language', language)}</label>
                  <select
                    value={settingsLanguage}
                    onChange={(e) => setSettingsLanguage(e.target.value)}
                  >
                    <option value="en">{t('english', language)}</option>
                    <option value="om">{t('afaanOromo', language)}</option>
                  </select>
                  <span className="settings-description">{t('languageNote', language)}</span>
                </div>
                <button
                  className="auth-btn"
                  style={{ marginTop: '1rem' }}
                  onClick={handleSaveSettings}
                >
                  {t('saveChanges', language)}
                </button>
              </div>
              <div className="settings-section">
                <h3>{t('preferences', language)}</h3>
                <div className="settings-item toggle">
                  <div>
                    <label>{t('darkMode', language)}</label>
                    <span className="settings-description">{t('useDarkTheme', language)}</span>
                  </div>
                  <div
                    className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                    onClick={onToggleTheme}
                  >
                    <div className="toggle-knob"></div>
                  </div>
                </div>
                <div className="settings-item toggle">
                  <div>
                    <label>{t('notifications', language)}</label>
                    <span className="settings-description">{t('receiveNotifications', language)}</span>
                  </div>
                  <div
                    className={`toggle-switch ${notifications ? 'active' : ''}`}
                    onClick={() => setNotifications(!notifications)}
                  >
                    <div className="toggle-knob"></div>
                  </div>
                </div>
              </div>
              <div className="settings-section">
                <h3>{t('about', language)}</h3>
                <div className="settings-about">
                  <p>{t('appName', language)} v1.0.0</p>
                  <p className="text-muted">{t('yourIntelligentPartner', language)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="settings-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>{t('keyboardShortcuts', language)}</h2>
              <button className="settings-close" onClick={() => setShowShortcuts(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <div className="shortcut-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>{t('newChat', language)}</span>
                  <span style={{ background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>Ctrl + N</span>
                </div>
                <div className="shortcut-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>{t('sendMessage', language)}</span>
                  <span style={{ background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>Enter</span>
                </div>
                <div className="shortcut-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>{t('toggleSidebar', language)}</span>
                  <span style={{ background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>Ctrl + S</span>
                </div>
                <div className="shortcut-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>{t('toggleSettings', language)}</span>
                  <span style={{ background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>Ctrl + ,</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
