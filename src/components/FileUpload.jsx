import React, { useState } from 'react'
import { uploadFile } from '../services/api'

export default function FileUpload({ token, onAnalysis }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleUpload(selectedFile) {
    if (!selectedFile) return
    setFile(selectedFile)
    setLoading(true)
    try {
      const res = await uploadFile(token, selectedFile)
      onAnalysis && onAnalysis(res)
    } catch (e) {
      console.error(e)
      onAnalysis && onAnalysis({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-start gap-3 mt-3">
      <label htmlFor="file-upload" title="Upload file" className="flex items-center gap-2 p-2 bg-white/6 hover:bg-white/10 rounded cursor-pointer text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L10.5 18.4a1.5 1.5 0 0 1-2.12-2.12l7.38-7.38"/></svg>
        <span className="text-white/80">{file ? file.name : 'Upload'}</span>
      </label>
      <input id="file-upload" type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f) handleUpload(f) }} />
    </div>
  )
}
