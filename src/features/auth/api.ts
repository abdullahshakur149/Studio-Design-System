import { supabase, setRememberMe } from '@/lib/supabase';
import { callFunction, ApiError } from '@/lib/api';
import { env } from '@/lib/env';
import { ROUTES } from '@/constants/routes';
import type { LoginInput, SignupInput, ForgotPasswordInput, ResetPasswordInput } from './schemas';

export interface CheckEmailResponse {
  exists: boolean;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const res = await callFunction<CheckEmailResponse>('check-email', {
    method: 'POST',
    body: { email },
  });
  return res.exists;
}

export interface SignupResult {
  needsVerification: boolean;
}

export async function signUp(input: SignupInput): Promise<SignupResult> {
  const { error, data } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${env.VITE_SITE_URL}${ROUTES.VERIFY_EMAIL}`,
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new Error('An account already exists with this email');
    }
    throw new Error(error.message);
  }
  return { needsVerification: !data.session };
}

export type LoginErrorField = 'email' | 'password' | 'form';
export class LoginError extends Error {
  constructor(public field: LoginErrorField, message: string) {
    super(message);
    this.name = 'LoginError';
  }
}

export async function login(input: LoginInput): Promise<void> {

  setRememberMe(input.remember);

  let emailExists = false;
  try {
    emailExists = await checkEmailExists(input.email);
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      throw new LoginError('form', 'Too many attempts. Please wait a moment and try again.');
    }

  }

  if (!emailExists) {
    throw new LoginError('email', 'No account found with this email');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      throw new LoginError('form', 'Please verify your email before signing in');
    }
    throw new LoginError('password', 'Incorrect password');
  }
}

export async function logout(): Promise<void> {
  setRememberMe(false);
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${env.VITE_SITE_URL}${ROUTES.RESET_PASSWORD}`,
  });
  if (error) throw new Error(error.message);
}

export async function setNewPassword(input: ResetPasswordInput): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) throw new Error(error.message);
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${env.VITE_SITE_URL}${ROUTES.VERIFY_EMAIL}` },
  });
  if (error) throw new Error(error.message);
}
