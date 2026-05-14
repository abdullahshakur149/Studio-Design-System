import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { VerifyEmailPendingPage } from '@/features/auth/pages/VerifyEmailPendingPage';
import { VerifyCallbackPage } from '@/features/auth/pages/VerifyCallbackPage';
import { AuthLayout } from '@/components/AuthLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CreatePage } from '@/features/generate/CreatePage';
import { LibraryPage } from '@/features/library/LibraryPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { NotFoundPage } from '@/features/system/NotFoundPage';
import { RedirectIfAuthenticated } from '@/features/auth/RequireVerifiedAuth';

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthenticated>
            <SignupPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email-pending" element={<VerifyEmailPendingPage />} />
      <Route path="/auth/verify" element={<VerifyCallbackPage />} />
      <Route path="/auth/reset-callback" element={<VerifyCallbackPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/create" element={<CreatePage />} />
        <Route path="/dashboard/library" element={<LibraryPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
