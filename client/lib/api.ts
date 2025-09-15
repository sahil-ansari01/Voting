export type ApiUser = { id: number; name: string; email: string }
export type ApiPollOption = { id: number; text: string }
export type ApiPoll = {
  id: number
  question: string
  isPublished: boolean
  createdAt?: string
  creator?: { id: number; name: string }
  options: ApiPollOption[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function getAuthHeader() {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(), ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data?.message || message
    } catch {}
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

// Users
export function apiCreateUser(input: { name: string; email: string; password: string }) {
  return request<ApiUser>('/api/users', { method: 'POST', body: JSON.stringify(input) })
}

export function apiListUsers() {
  return request<ApiUser[]>('/api/users')
}

// Auth
export function apiLogin(input: { email: string; password: string }) {
  return request<{ token: string; user: ApiUser }>('/api/users/login', { method: 'POST', body: JSON.stringify(input) })
}

// Polls
export function apiListPolls() {
  return request<ApiPoll[]>('/api/polls')
}

export function apiGetPoll(id: number) {
  return request<ApiPoll>(`/api/polls/${id}`)
}

export function apiCreatePoll(input: { creatorId: number; question: string; options: string[]; isPublished?: boolean }) {
  return request<ApiPoll>('/api/polls', { method: 'POST', body: JSON.stringify(input) })
}

// Votes
export function apiCreateVote(input: { userId: number; pollOptionId: number }) {
  return request<{ id: number; userId: number; pollOptionId: number }>(
    '/api/votes',
    { method: 'POST', body: JSON.stringify(input) }
  )
}

// Delete poll
export function apiDeletePoll(id: number) {
  return request<void>(`/api/polls/${id}`, { method: 'DELETE' })
}


