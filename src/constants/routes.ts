export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL_PENDING: '/verify-email-pending',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  DASHBOARD_CREATE: '/dashboard/create',
  DASHBOARD_LIBRARY: '/dashboard/library',
  DASHBOARD_PROFILE: '/dashboard/profile',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
