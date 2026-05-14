import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const REQUIRED_CLIENT_VARS = [
  { name: 'VITE_SUPABASE_URL', validate: (v: string) => /^https?:\/\//.test(v) || 'must be a valid URL' },
  { name: 'VITE_SUPABASE_ANON_KEY', validate: (v: string) => v.length > 20 || 'looks too short to be a real key' },
  { name: 'VITE_SITE_URL', validate: (v: string) => /^https?:\/\//.test(v) || 'must be a valid URL' },
] as const;

function checkEnv(mode: string): void {
  const env = loadEnv(mode, process.cwd(), '');
  const failures: string[] = [];

  for (const v of REQUIRED_CLIENT_VARS) {
    const value = env[v.name];
    if (!value || value.trim() === '') {
      failures.push(`  • ${v.name}: required but missing or empty`);
      continue;
    }
    const ok = v.validate(value);
    if (ok !== true) failures.push(`  • ${v.name}: ${ok}`);
  }

  if (failures.length > 0) {
    const message =
      '\n❌ Studio cannot start — environment variables are missing or invalid:\n' +
      failures.join('\n') +
      '\n\nFix by copying .env.example to .env.local and filling in the required values.\n';

    console.error(message);
    throw new Error('Invalid environment configuration');
  }
}

export default defineConfig(({ mode }) => {
  checkEnv(mode);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
    },
  };
});
