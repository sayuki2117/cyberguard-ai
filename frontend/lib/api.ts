// ═══════════════════════════════════════════════════════════════
// FILE: lib/api.ts
// PURPOSE: Axios API client pre-configured for our backend.
//          Automatically attaches the JWT token to every request.
//          Handles 401 errors globally (auto-logout on token expiry).
// ═══════════════════════════════════════════════════════════════

import axios, { isAxiosError } from 'axios'

function withApiPath(url: string) {
  if (!url) {
    return '/api'
  }

  const trimmedUrl = url.replace(/\/$/, '')
  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`
}

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || ''

  if (typeof window === 'undefined') {
    return withApiPath(configuredUrl)
  }

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  if (isLocalhost) {
    return withApiPath(configuredUrl)
  }

  return '/api'
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,   // 30 second timeout
})

// Request interceptor: attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('cyberguard_token')
    : null

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cyberguard_token')
      localStorage.removeItem('cyberguard_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
