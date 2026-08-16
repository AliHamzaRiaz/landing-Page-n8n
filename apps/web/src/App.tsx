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
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { TermsOfServicePage } from '@/pages/TermsOfServicePage'
import { DataDeletionPage } from '@/pages/DataDeletionPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { CampaignWizardPage } from '@/pages/CampaignWizardPage'
import { CampaignDetailPage } from '@/pages/CampaignDetailPage'
import { SocialAccountsPage } from '@/pages/SocialAccountsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { MediaLibraryPage } from '@/pages/MediaLibraryPage'
import { ScheduledPostsPage } from '@/pages/ScheduledPostsPage'

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
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/new" element={<CampaignWizardPage />} />
              <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="/media" element={<MediaLibraryPage />} />
              <Route path="/scheduled" element={<ScheduledPostsPage />} />
              <Route path="/social-accounts" element={<SocialAccountsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
            <Route path="/data-deletion" element={<DataDeletionPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
