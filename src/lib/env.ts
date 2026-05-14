import { z } from 'zod';

const optionalString = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().min(1).optional(),
);

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_SENTRY_DSN: optionalString,
  VITE_SITE_URL: z.string().url('VITE_SITE_URL must be a valid URL'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function loadEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(
      `\n❌ Missing or invalid environment variables:\n${issues}\n\n` +
        `Copy .env.example to .env.local and fill in the required values.\n`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
