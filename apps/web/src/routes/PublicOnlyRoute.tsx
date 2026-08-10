import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, business } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={business?.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />
  }

  return <Outlet />
}
