// ═══════════════════════════════════════════════════════════════
// FILE: store/authStore.ts
// PURPOSE: Global authentication state using Zustand.
//          Zustand = lightweight state management.
//          Think of it as a global variable store that
//          automatically re-renders components when state changes.
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isAxiosError } from 'axios'
import { AuthState } from '@/types'
import api from '@/lib/api'

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || fallback
  }

  return fallback
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isLoading:       false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('cyberguard_token', data.access_token)
          set({
            user:            data.user,
            token:           data.access_token,
            isAuthenticated: true,
            isLoading:       false,
          })
        } catch (error: unknown) {
          set({ isLoading: false })
          throw new Error(getAuthErrorMessage(error, 'Login failed'))
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', {
                                  email,
                                  password,
                                  full_name: fullName,
                                })
          localStorage.setItem('cyberguard_token', data.access_token)
          set({
            user:            data.user,
            token:           data.access_token,
            isAuthenticated: true,
            isLoading:       false,
          })
        } catch (error: unknown) {
          set({ isLoading: false })
          throw new Error(getAuthErrorMessage(error, 'Registration failed'))
        }
      },

      logout: () => {
        localStorage.removeItem('cyberguard_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'cyberguard_user',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
