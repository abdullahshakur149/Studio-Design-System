// Supabase Send Email Hook receiver — Deno. Called by Supabase Auth system-to-system.
// Configured in supabase/config.toml with verify_jwt = false.

import { Webhook } from 'npm:standardwebhooks@1.0.0';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { sendWelcomeVerify, sendPasswordReset } from '../_shared/email.ts';
import { ApiError, errorResponse } from '../_shared/errors.ts';

interface EmailHookPayload {
  user: { id: string; email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change';
    site_url: string;
  };
}

function siteUrl(): string {
  return Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
}

function buildVerifyUrl(tokenHash: string, redirectTo: string): string {
  const next = encodeURIComponent(redirectTo);
  return `${siteUrl()}/auth/verify?token_hash=${tokenHash}&type=signup&next=${next}`;
}

function buildRecoveryUrl(tokenHash: string, redirectTo: string): string {
  const next = encodeURIComponent(redirectTo);
  return `${siteUrl()}/auth/verify?token_hash=${tokenHash}&type=recovery&next=${next}`;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return errorResponse(new ApiError(405, 'method_not_allowed', 'Method Not Allowed'));
  }

  try {
    const secret = Deno.env.get('SUPABASE_AUTH_HOOK_SECRET');
    if (!secret) throw new ApiError(500, 'unknown', 'SUPABASE_AUTH_HOOK_SECRET not configured');

    // Supabase prefixes the secret with "v1,whsec_" — standardwebhooks expects bare base64
    const bareSecret = secret.startsWith('v1,whsec_') ? secret.slice('v1,whsec_'.length) : secret;
    const wh = new Webhook(bareSecret);

    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const payload = wh.verify(rawBody, headers) as EmailHookPayload;
    const { user, email_data } = payload;

    if (email_data.email_action_type === 'signup') {
      const verifyUrl = buildVerifyUrl(email_data.token_hash, email_data.redirect_to);
      await sendWelcomeVerify(user.email, verifyUrl);
    } else if (email_data.email_action_type === 'recovery') {
      const resetUrl = buildRecoveryUrl(email_data.token_hash, email_data.redirect_to);
      await sendPasswordReset(user.email, resetUrl);
    } else {
      console.log(`Ignoring unsupported email_action_type: ${email_data.email_action_type}`);
    }

    return jsonResponse({});
  } catch (err) {
    console.error('email-hook error:', err);
    return errorResponse(err);
  }
});
