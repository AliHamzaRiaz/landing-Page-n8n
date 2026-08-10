import axios, { AxiosError, type AxiosInstance } from 'axios'
import { authStorage } from '@/lib/auth-storage'

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[]; error?: string }>) => {
    if (error.response?.status === 401) {
      authStorage.clear()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.assign(`/login?redirect=${redirect}`)
      }
    }
    return Promise.reject(error)
  },
)

const PRISMA_HINTS = [
  'prisma',
  'invocation',
  'unique constraint',
  'foreign key',
  'invalid `prisma',
  'database error',
  'sqlstate',
  'econnrefused',
]

export function getFriendlyErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback

  if (typeof error === 'string') {
    return sanitizeMessage(error, fallback)
  }

  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'Unable to reach the server. Check your connection and try again.'
    }

    const payload = error.response.data
    const raw =
      (typeof payload?.message === 'string' && payload.message) ||
      (Array.isArray(payload?.message) && payload.message.join(', ')) ||
      (typeof payload?.error === 'string' && payload.error) ||
      error.message

    if (error.response.status === 401) return 'Your session has expired. Please sign in again.'
    if (error.response.status === 403) return 'You do not have permission to perform this action.'
    if (error.response.status === 404) return 'The requested resource was not found.'
    if (error.response.status === 429) return 'Too many requests. Please wait a moment and try again.'
    if (error.response.status >= 500) return 'A server error occurred. Please try again shortly.'

    return sanitizeMessage(raw, fallback)
  }

  if (error instanceof Error) {
    return sanitizeMessage(error.message, fallback)
  }

  return fallback
}

function sanitizeMessage(message: string, fallback: string): string {
  const normalized = message.trim()
  if (!normalized) return fallback
  const lower = normalized.toLowerCase()
  if (PRISMA_HINTS.some((hint) => lower.includes(hint))) {
    return fallback
  }
  if (normalized.length > 240) {
    return fallback
  }
  return normalized
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<ApiEnvelope<T> | T>(url, { params })
  return unwrap(data)
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiEnvelope<T> | T>(url, body)
  return unwrap(data)
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiEnvelope<T> | T>(url, body)
  return unwrap(data)
}

export async function apiDelete<T>(url: string): Promise<T> {
  const { data } = await api.delete<ApiEnvelope<T> | T>(url)
  return unwrap(data)
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as ApiEnvelope<T>).data
  }
  return payload as T
}
