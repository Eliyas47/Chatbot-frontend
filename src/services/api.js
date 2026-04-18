const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

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

  const response = await fetch(`${API_BASE}${path}`, init)
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.error || payload?.detail || payload?.message || 'Request failed'
    throw new Error(message)
  }

  return payload
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