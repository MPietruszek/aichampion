import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

// Demo użytkownicy (tylko tryb demo — bez backendu)
const DEMO_USERS: Record<string, { name: string; user_id: string }> = {
  'aichampion:krzysiek12': { name: 'AI Champion', user_id: 'demo-1' },
  'admin:krzysiek12':      { name: 'Administrator', user_id: 'demo-2' },
}

interface AuthUser {
  user_id: string
  email: string
  name: string
  access_token: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })

        if (DEMO) {
          await new Promise((r) => setTimeout(r, 600))
          const key = `${email.trim()}:${password}`
          const found = DEMO_USERS[key]
          if (!found) {
            set({ loading: false, error: 'Nieprawidłowy login lub hasło' })
            throw new Error('Nieprawidłowy login lub hasło')
          }
          set({
            loading: false,
            user: { user_id: found.user_id, email: email.trim(), name: found.name, access_token: 'demo-token' },
          })
          return
        }

        try {
          const form = new URLSearchParams({ username: email, password })
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Błąd logowania' }))
            throw new Error(err.detail)
          }
          const data = await res.json()
          set({ user: data, loading: false })
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Błąd logowania', loading: false })
          throw e
        }
      },

      register: async (email, name, password) => {
        set({ loading: true, error: null })

        if (DEMO) {
          await new Promise((r) => setTimeout(r, 600))
          set({ loading: false, error: 'Rejestracja wyłączona w trybie demo' })
          throw new Error('Rejestracja wyłączona w trybie demo')
        }

        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Błąd rejestracji' }))
            throw new Error(err.detail)
          }
          const data = await res.json()
          set({ user: data, loading: false })
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Błąd rejestracji', loading: false })
          throw e
        }
      },

      logout: () => set({ user: null, error: null }),
    }),
    {
      name: 'czat-umowy-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
)
