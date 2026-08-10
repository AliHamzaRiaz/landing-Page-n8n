import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { VerifyPage } from '@/pages/VerifyPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { WhatsAppPage } from '@/pages/WhatsAppPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { CustomerOrderPage } from '@/pages/CustomerOrderPage'
import { VendorPortalPage } from '@/pages/VendorPortalPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/order/:businessSlug" element={<CustomerOrderPage />} />
            <Route path="/vendor/:token" element={<VendorPortalPage />} />
            <Route path="/verify" element={<VerifyPage />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/register" element={<Navigate to="/signup" replace />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route
              path="/privacy"
              element={
                <LegalPage
                  title="Privacy Policy"
                  body="Ennitant collects only the account, business, and order data needed to operate WhatsApp order management. We do not sell customer data."
                />
              }
            />
            <Route
              path="/terms"
              element={
                <LegalPage
                  title="Terms of Service"
                  body="By using Ennitant you agree to use the platform for legitimate business messaging and order management in compliance with WhatsApp and Meta policies."
                />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function LegalPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-display text-2xl font-semibold text-brand">Ennitant</p>
      <h1 className="mt-6 text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-4 text-muted leading-relaxed">{body}</p>
    </div>
  )
}
