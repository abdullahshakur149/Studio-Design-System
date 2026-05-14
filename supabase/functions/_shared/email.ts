// Resend integration + template loading. Uses Resend's REST API directly via fetch
// rather than the npm SDK to keep the Deno bundle minimal and avoid SDK quirks.

const TEMPLATE_NAMES = [
  '01-welcome-verify.html',
  '02-password-reset.html',
  '03-first-creation.html',
] as const;

type TemplateName = (typeof TEMPLATE_NAMES)[number];

const templateCache = new Map<TemplateName, string>();

async function loadTemplate(name: TemplateName): Promise<string> {
  const cached = templateCache.get(name);
  if (cached) return cached;
  const url = new URL(`./templates/${name}`, import.meta.url);
  const html = await Deno.readTextFile(url);
  templateCache.set(name, html);
  return html;
}

export function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend({ to, subject, html }: SendArgs): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const from = `Studio <${fromEmail}>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${errBody.slice(0, 200)}`);
  }
}

function siteUrl(): string {
  return Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
}

export async function sendWelcomeVerify(to: string, verifyUrl: string): Promise<void> {
  const tpl = await loadTemplate('01-welcome-verify.html');
  const html = renderTemplate(tpl, { verify_url: verifyUrl, site_url: siteUrl() });
  await sendViaResend({ to, subject: 'Welcome to Studio — verify your email', html });
}

export async function sendPasswordReset(to: string, resetUrl: string): Promise<void> {
  const tpl = await loadTemplate('02-password-reset.html');
  const html = renderTemplate(tpl, { reset_url: resetUrl, site_url: siteUrl() });
  await sendViaResend({ to, subject: 'Reset your Studio password', html });
}

export async function sendFirstCreation(to: string, displayName: string): Promise<void> {
  const tpl = await loadTemplate('03-first-creation.html');
  const html = renderTemplate(tpl, {
    library_url: `${siteUrl()}/dashboard/library`,
    site_url: siteUrl(),
    display_name: displayName,
  });
  await sendViaResend({ to, subject: 'Your first Studio creation is ready', html });
}
