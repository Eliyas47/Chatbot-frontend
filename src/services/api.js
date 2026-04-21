const API_BASE_FROM_ENV = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const DEPLOYED_BACKEND_API_BASE = 'https://django-gemini-chatbot.onrender.com/api'

function getDefaultApiCandidates() {
  if (typeof window === 'undefined') {
    return ['/api', DEPLOYED_BACKEND_API_BASE]
  }

  const host = window.location.hostname
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'

  if (isLocalHost) {
    return ['http://127.0.0.1:8000/api', DEPLOYED_BACKEND_API_BASE]
  }

  return ['/api', DEPLOYED_BACKEND_API_BASE]
}

const API_BASE_CANDIDATES = API_BASE_FROM_ENV
  ? [API_BASE_FROM_ENV]
  : getDefaultApiCandidates()

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function getAuthHeaders(token) {
  return token ? { Authorization: `Token ${token}` } : {}
}

function isHtmlPayload(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim().toLowerCase()
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')
}

async function request(path, { method = 'GET', token, data, formData } = {}) {
  const headers = {
    ...getAuthHeaders(token),
  }

  const init = { method, headers }

  if (formData) {
    init.body = formData
  } else if (data !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(data)
  }

  let lastError = null

  for (let i = 0; i < API_BASE_CANDIDATES.length; i += 1) {
    const base = API_BASE_CANDIDATES[i]
    const isLastCandidate = i === API_BASE_CANDIDATES.length - 1

    try {
      const response = await fetch(`${base}${path}`, init)
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json') ? await response.json() : await response.text()

      if (response.ok) {
        return payload
      }

      const message = typeof payload === 'string'
        ? (isHtmlPayload(payload) ? 'Server error. Please try again in a few seconds.' : payload)
        : payload?.error || payload?.detail || payload?.message || 'Request failed'

      // If /api is not available in this runtime, retry against the next candidate.
      const shouldRetryWithNextBase = [404, 405, 502, 503, 504].includes(response.status)
      if (!API_BASE_FROM_ENV && !isLastCandidate && shouldRetryWithNextBase) {
        lastError = new Error(message)
        continue
      }

      throw new Error(message)
    } catch (error) {
      if (!isLastCandidate) {
        lastError = error
        continue
      }

      if (!API_BASE_FROM_ENV) {
        throw new Error('Cannot reach backend API. Ensure Django is running on http://127.0.0.1:8000.')
      }

      throw error
    }
  }

  throw lastError || new Error('Request failed')
}

function normalizeUser(user, fallbackIdentifier = '') {
  if (!user) {
    const identifier = fallbackIdentifier || ''
    return {
      username: identifier,
      email: identifier.includes('@') ? identifier : '',
    }
  }

  return {
    id: user.id,
    username: user.username || fallbackIdentifier,
    email: user.email || (fallbackIdentifier.includes('@') ? fallbackIdentifier : ''),
  }
}

export async function login(usernameOrEmail, password) {
  const payload = await request('/login/', {
    method: 'POST',
    data: {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password,
    },
  })

  return {
    token: payload.token,
    user: normalizeUser(payload.user, usernameOrEmail),
  }
}

export async function register(usernameOrEmail, password) {
  const payload = await request('/register/', {
    method: 'POST',
    data: {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password,
    },
  })

  return {
    token: payload.token,
    user: normalizeUser(payload.user, usernameOrEmail),
  }
}

export async function getUser() {
  const raw = localStorage.getItem('user')
  return raw ? safeJsonParse(raw, null) : null
}

export async function updateUser(userData) {
  const current = (await getUser()) || {}
  const updated = { ...current, ...userData }
  localStorage.setItem('user', JSON.stringify(updated))
  return updated
}

export async function createConversation(token, title = 'New Chat') {
  return request('/conversations/create/', {
    method: 'POST',
    token,
    data: { title },
  })
}

export async function listConversations(token, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  const payload = await request(`/conversations/${query}`, {
    token,
  })

  if (Array.isArray(payload)) return payload
  return payload?.conversations || []
}

export async function getConversationMessages(token, conversationId) {
  return request(`/conversations/${conversationId}/messages/`, { token })
}

export async function deleteConversation(token, conversationId) {
  return request(`/conversations/${conversationId}/delete/`, {
    method: 'DELETE',
    token,
  })
}

export async function renameConversation(token, conversationId, title) {
  return request(`/conversations/${conversationId}/rename/`, {
    method: 'PATCH',
    token,
    data: { title },
  })
}

export async function sendMessage(token, text, convoId = null) {
  let conversationId = convoId
  let createdConversation = null

  if (!conversationId) {
    createdConversation = await createConversation(token, text.slice(0, 48) || 'New Chat')
    conversationId = createdConversation.conversation_id
  }

  const payload = await request('/chat/', {
    method: 'POST',
    token,
    data: {
      conversation_id: conversationId,
      message: text,
    },
  })

  return {
    conversation_id: payload.conversation_id || conversationId,
    title: payload.title || createdConversation?.title || null,
    message: payload.message || payload.ai_response || payload.reply || '',
    ai_response: payload.ai_response || payload.message || payload.reply || '',
    raw: payload,
  }
}

export async function uploadFile(token, file, conversationId = null, prompt = 'Analyze this file.') {
  let resolvedConversationId = conversationId
  let createdConversation = null

  if (!resolvedConversationId) {
    createdConversation = await createConversation(token, file?.name ? `File: ${file.name}` : 'File upload')
    resolvedConversationId = createdConversation.conversation_id
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('conversation_id', String(resolvedConversationId))
  formData.append('prompt', prompt)

  const payload = await request('/chat/upload/', {
    method: 'POST',
    token,
    formData,
  })

  return {
    conversation_id: resolvedConversationId,
    title: createdConversation?.title || null,
    summary: payload.analysis || payload.summary || payload.message || '',
    analysis: payload.analysis || payload.summary || payload.message || '',
    raw: payload,
  }
}

export async function regenerateResponse(token, conversationId) {
  return request('/chat/regenerate/', {
    method: 'POST',
    token,
    data: { conversation_id: conversationId },
  })
}

export async function getApiInfo() {
  return request('/info/')
}

export default {
  login,
  register,
  getUser,
  updateUser,
  createConversation,
  listConversations,
  getConversationMessages,
  deleteConversation,
  renameConversation,
  sendMessage,
  uploadFile,
  regenerateResponse,
  getApiInfo,
}