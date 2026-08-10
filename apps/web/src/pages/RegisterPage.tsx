import { Navigate } from 'react-router-dom'

/** @deprecated Use SignupPage at /signup */
export function RegisterPage() {
  return <Navigate to="/signup" replace />
}
