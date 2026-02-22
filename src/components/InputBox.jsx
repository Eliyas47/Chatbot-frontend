import React, { useState, useRef, useEffect } from 'react'
import { uploadFile } from '../services/api'

export default function InputBox({ onSend, token, onFileAnalysis }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [message])

  async function handleSend() {
    if ((!message.trim() && !selectedFile) || sending) return
    setSending(true)
    try {
      // If there's a file, upload it first
      if (selectedFile) {
        setUploading(true)
        try {
          const res = await uploadFile(token, selectedFile)
          if (onFileAnalysis) onFileAnalysis(res)
        } catch (e) {
          if (onFileAnalysis) onFileAnalysis({ error: e.message })
        }
        setUploading(false)
        setSelectedFile(null)
      }

      // Send the message if there is one
      if (message.trim()) {
        await onSend(message)
        setMessage('')
      }
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  function removeFile() {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="input-container">
        {selectedFile && (
          <div className="attached-file">
            <div className="attached-file-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{selectedFile.name}</span>
            </div>
            <button className="attached-file-remove" onClick={removeFile}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input-textarea"
          rows={1}
          placeholder="Message Ella..."
        />
        <div className="input-actions">
          <div className="input-tools">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              className="input-tool-btn"
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L10.5 18.4a1.5 1.5 0 0 1-2.12-2.12l7.38-7.38" />
              </svg>
            </button>
            <button className="input-tool-btn" title="Voice input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={sending || uploading || (!message.trim() && !selectedFile)}
            className="send-btn"
            aria-label="Send message"
          >
            {sending || uploading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {uploading ? 'Uploading' : 'Sending'}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>
      </div>
      <div className="input-hint">
        Ella AI can make a mistake. Check important info.
      </div>
    </>
  )
}
