import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
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
      <Route path={ROUTES.HOME} element={<LandingPage />} />
      <Route
        path={ROUTES.SIGNUP}
        element={
          <RedirectIfAuthenticated>
            <SignupPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path={ROUTES.LOGIN}
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      <Route path={ROUTES.VERIFY_EMAIL_PENDING} element={<VerifyEmailPendingPage />} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyCallbackPage />} />
      <Route path="/auth/verify" element={<VerifyCallbackPage />} />
      <Route path="/auth/reset-callback" element={<VerifyCallbackPage />} />

      <Route element={<AuthLayout />}>
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.DASHBOARD_CREATE} element={<CreatePage />} />
        <Route path={ROUTES.DASHBOARD_LIBRARY} element={<LibraryPage />} />
        <Route path={ROUTES.DASHBOARD_PROFILE} element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
