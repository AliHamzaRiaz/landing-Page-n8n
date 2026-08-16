import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'ennitant_access_token'

export function apiBase(): string {
  return (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${apiBase()}${path}`, { ...options, headers })
  const json = (await res.json().catch(() => ({}))) as {
    message?: string
    error?: string
    data?: T
  }
  if (!res.ok) {
    throw new Error(json.message || json.error || `Request failed (${res.status})`)
  }
  return (json.data ?? json) as T
}
