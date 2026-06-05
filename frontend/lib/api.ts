// ═══════════════════════════════════════════════════════════════
// FILE: lib/api.ts
// PURPOSE: Axios API client pre-configured for our backend.
//          Automatically attaches the JWT token to every request.
//          Handles 401 errors globally (auto-logout on token expiry).
// ═══════════════════════════════════════════════════════════════

import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
