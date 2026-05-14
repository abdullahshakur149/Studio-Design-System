import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function readEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const raw of fs.readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const envFile = readEnvLocal();
const siteUrl = (process.env.VITE_SITE_URL || envFile.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
const lastmod = new Date().toISOString().slice(0, 10);

const urls = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/signup', priority: '0.8', changefreq: 'monthly' },
  { path: '/login', priority: '0.5', changefreq: 'monthly' },
];

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${siteUrl}${u.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`;

const outPath = path.join(ROOT, 'public', 'sitemap.xml');
fs.writeFileSync(outPath, xml);

const robotsPath = path.join(ROOT, 'public', 'robots.txt');
const robots = `User-agent: *\nDisallow: /dashboard\nDisallow: /verify-email\nDisallow: /verify-email-pending\nDisallow: /reset-password\nDisallow: /forgot-password\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
fs.writeFileSync(robotsPath, robots);

console.log(`Wrote sitemap.xml and robots.txt for ${siteUrl}`);
