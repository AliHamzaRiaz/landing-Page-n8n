import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getFriendlyErrorMessage } from '@/lib/api'

describe('getFriendlyErrorMessage', () => {
  it('hides prisma-style messages', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} } as never,
      data: {
        message: 'Invalid `prisma.order.findMany()` invocation',
      },
    }

    expect(getFriendlyErrorMessage(error)).toBe('Something went wrong. Please try again.')
  })

  it('returns network guidance when offline', () => {
    const error = new AxiosError('Network Error')
    expect(getFriendlyErrorMessage(error)).toBe(
      'Unable to reach the server. Check your connection and try again.',
    )
  })

  it('passes through safe API messages', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} } as never,
      data: { message: 'Email is already registered' },
    }

    expect(getFriendlyErrorMessage(error)).toBe('Email is already registered')
  })

  it('shows credential errors instead of session expired on login 401', () => {
    const error = new AxiosError('Request failed')
    error.config = { url: '/auth/login', headers: {} } as never
    error.response = {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { url: '/auth/login', headers: {} } as never,
      data: { message: 'Invalid phone number or password' },
    }

    expect(getFriendlyErrorMessage(error)).toBe('Invalid phone number or password')
  })
})
