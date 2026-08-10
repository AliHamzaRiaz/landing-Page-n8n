import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AxiosError } from 'axios'
import { apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { pendingOtpStorage, pendingPhoneStorage } from '@/lib/phone'
import type { AuthResponse, Business, RegisterResponse, User } from '@/types'

interface AuthContextValue {
  user: User | null
  business: Business | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (phoneNumber: string, password: string) => Promise<AuthResponse>
  register: (payload: {
    phoneNumber: string
    password: string
    confirmPassword: string
  }) => Promise<RegisterResponse>
  verify: (phoneNumber: string, code: string) => Promise<AuthResponse>
  resendOtp: (phoneNumber: string) => Promise<{ devCode?: string }>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
  setBusiness: (business: Business) => void
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyAuth = useCallback((payload: AuthResponse) => {
    authStorage.setTokens(payload.accessToken, payload.refreshToken)
    setUser(payload.user)
    setBusiness(payload.business)
    pendingPhoneStorage.clear()
    pendingOtpStorage.clear()
  }, [])

  const refreshMe = useCallback(async () => {
    const token = authStorage.getAccessToken()
    if (!token) {
      setUser(null)
      setBusiness(null)
      setIsLoading(false)
      return
    }

    try {
      const me = await apiGet<{ user: User; business: Business } | User>('/auth/me')
      if (me && typeof me === 'object' && 'user' in me) {
        setUser(me.user)
        setBusiness(me.business)
      } else {
        setUser(me as User)
      }
    } catch {
      authStorage.clear()
      setUser(null)
      setBusiness(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const login = useCallback(
    async (phoneNumber: string, password: string) => {
      setError(null)
      try {
        const data = await apiPost<AuthResponse>('/auth/login', { phoneNumber, password })
        applyAuth(data)
        return data
      } catch (err) {
        if (err instanceof AxiosError) {
          const payload = err.response?.data as
            | {
                code?: string
                phoneNumber?: string
                message?: string | string[] | { code?: string; phoneNumber?: string; message?: string }
              }
            | undefined
          const nested =
            payload?.message && typeof payload.message === 'object' && !Array.isArray(payload.message)
              ? payload.message
              : null
          const code = payload?.code || nested?.code
          const messageText = Array.isArray(payload?.message)
            ? payload.message.join(' ')
            : typeof payload?.message === 'string'
              ? payload.message
              : String(nested?.message ?? '')
          if (code === 'PHONE_NOT_VERIFIED' || messageText.includes('verify your phone')) {
            const phone = payload?.phoneNumber || nested?.phoneNumber || phoneNumber
            pendingPhoneStorage.set(phone)
            const message = 'Please verify your phone number first'
            setError(message)
            const verifyError = new Error(message) as Error & { code?: string; phoneNumber?: string }
            verifyError.code = 'PHONE_NOT_VERIFIED'
            verifyError.phoneNumber = phone
            throw verifyError
          }
        }
        const message = getFriendlyErrorMessage(err, 'Unable to sign in with those credentials.')
        setError(message)
        throw new Error(message)
      }
    },
    [applyAuth],
  )

  const register = useCallback(
    async (payload: { phoneNumber: string; password: string; confirmPassword: string }) => {
      setError(null)
      try {
        const data = await apiPost<RegisterResponse>('/auth/register', payload)
        pendingPhoneStorage.set(data.phoneNumber)
        if (data.devCode) pendingOtpStorage.set(data.devCode)
        return data
      } catch (err) {
        const message = getFriendlyErrorMessage(err, 'Unable to create your account.')
        setError(message)
        throw new Error(message)
      }
    },
    [],
  )

  const verify = useCallback(
    async (phoneNumber: string, code: string) => {
      setError(null)
      try {
        const data = await apiPost<AuthResponse>('/auth/verify', { phoneNumber, code })
        applyAuth(data)
        return data
      } catch (err) {
        const message = getFriendlyErrorMessage(err, 'Unable to verify that code.')
        setError(message)
        throw new Error(message)
      }
    },
    [applyAuth],
  )

  const resendOtp = useCallback(async (phoneNumber: string) => {
    setError(null)
    try {
      const data = await apiPost<{ phoneNumber?: string; devCode?: string }>('/auth/resend-otp', {
        phoneNumber,
      })
      if (data?.devCode) pendingOtpStorage.set(data.devCode)
      return { devCode: data?.devCode }
    } catch (err) {
      const message = getFriendlyErrorMessage(err, 'Unable to resend the code right now.')
      setError(message)
      throw new Error(message)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout')
    } catch {
      // Best-effort logout; always clear local session.
    } finally {
      authStorage.clear()
      pendingPhoneStorage.clear()
      pendingOtpStorage.clear()
      setUser(null)
      setBusiness(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      business,
      isAuthenticated: Boolean(user && authStorage.getAccessToken()),
      isLoading,
      error,
      login,
      register,
      verify,
      resendOtp,
      logout,
      refreshMe,
      setBusiness,
      clearError: () => setError(null),
    }),
    [user, business, isLoading, error, login, register, verify, resendOtp, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
