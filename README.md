# Studio — Create AI Videos and Photos Free

A focused, friendly studio for making AI photos and short videos from text prompts. Sign up, type what you want to see, and Studio creates it. Everything you make is saved to your own private library where you can view, download, and tidy up your creations whenever you like.

This project is a complete, production-quality web app built end to end — authentication with custom emails, real AI generation, a personal media library, GDPR-compliant account deletion, error tracking, and a polished interface. It is meant to read like real production code, not a prototype.

## Who This Is For

Anyone who wants to make AI photos and short clips without subscribing to a paid creative tool. Designers exploring ideas, marketers prototyping social posts, hobbyists having fun. You would use Studio instead of hiring someone because the cost is zero and the iteration is fast — every idea is one prompt away.

## What You Can Do In The App

- Create an account with email and password
- Receive a welcome email with a one-click verification link
- Sign in (with a "remember me" option for 30-day sessions)
- Reset your password by email if you forget it
- Generate AI photos from a text prompt, choosing one of five styles and three aspect ratios
- Generate short AI videos from a text prompt (optionally seeded with a reference image), choosing one of four moods and three motion intensities
- See every creation saved automatically in your personal library
- Filter the library by photos or videos, sort by newest or oldest
- Download any creation as a file
- Copy a creation's prompt to your clipboard so you can reuse it
- Delete any creation permanently
- Edit your display name
- Permanently delete your account and all your media (GDPR-compliant erasure)

## How To Run It On Your Computer

Assume you are starting on a brand-new computer. Follow each step in order.

### 1. Install Node.js (version 20)

Download and install Node.js 20 from **https://nodejs.org/**. Pick the "LTS" version that says 20.x.

Verify it worked by opening Terminal and typing:

```bash
node -v
```

You should see something starting with `v20.` printed back.

> If you already use **nvm** (Node Version Manager) to switch Node versions, this repo includes a `.nvmrc` file. Just run `nvm use` inside the project folder.

### 2. Get the code

```bash
git clone <this-repo-url>
cd Studio-Design-System
```

### 3. Install dependencies

This downloads every package the app needs:

```bash
npm install
```

This takes about a minute. You may see some warnings about deprecated packages — those are from third-party tools and are safe to ignore.

### 4. Set up your environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor. You will see a list of blank values like `VITE_SUPABASE_URL=`. Each one needs a real value, which you'll collect in **How To Get Your API Keys** below.

### 5. Set up Supabase (database, auth, file storage)

Follow the steps in **How To Set Up The Database** below. When you finish, you will have filled in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_AUTH_HOOK_SECRET`
- `SUPABASE_PROJECT_ID`

### 6. Get your other API keys

Follow **How To Get Your API Keys** below. When you finish, you will have filled in:

- `HUGGINGFACE_API_TOKEN`
- `RESEND_API_KEY`
- `SENTRY_DSN` (optional but recommended)
- `VITE_SENTRY_DSN` (optional but recommended)

Set these two to point at your local dev server:

- `VITE_SITE_URL=http://localhost:5173`
- `SITE_URL=http://localhost:5173`

### 7. Start the app

```bash
npm run dev
```

This starts the development server. Open **http://localhost:5173** in your browser.

To use the AI generation features and custom emails, you also need to run the Vercel dev server (which runs the serverless functions in `api/`). In a separate terminal:

```bash
npx vercel dev
```

> The first time you run `vercel dev`, it will ask you to log in and link the project to a Vercel account. Follow the prompts.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the front-end dev server |
| `npm run build` | Type-check and build the production bundle |
| `npm run typecheck` | Run TypeScript type checks only |
| `npm run lint` | Check the code with ESLint |
| `npm run supabase:types` | Re-generate database TypeScript types from your Supabase project |

## How To Set Up The Database

Studio uses Supabase for the database, authentication, and file storage. Supabase is free for hobby use.

### Step 1: Create your Supabase project

1. Go to **https://supabase.com/** and sign up (free).
2. In the dashboard, click **New project**.
3. Pick any name (e.g. `studio`), any region close to you, and a strong database password (save this somewhere safe — you won't need it again but should not lose it).
4. Wait about 60 seconds for the project to provision.

### Step 2: Run the database migration

Once the project is ready:

1. In the Supabase dashboard sidebar click **SQL Editor**.
2. Open the file `supabase/migrations/20260514120000_initial.sql` from this repository.
3. Copy its entire contents and paste it into the SQL Editor.
4. Click **Run** (bottom right). You should see a green "Success" message.

This creates all the tables (`profiles`, `media`, `generation_logs`), all the Row Level Security policies (so people only see their own creations), and three private storage buckets (`media-photos`, `media-videos`, `user-uploads`).

### Step 3: Find your project keys

In your Supabase dashboard:

1. Click the gear icon (Project Settings) in the sidebar.
2. Click **API**.
3. You will see:
   - **Project URL** → copy into `VITE_SUPABASE_URL` in `.env.local`
   - **anon public** key → copy into `VITE_SUPABASE_ANON_KEY`
   - **service_role** key (click to reveal) → copy into `SUPABASE_SERVICE_ROLE_KEY` (this one is secret — never expose it client-side)
4. In the same page, find **Project ID** (usually shown as `Reference ID`) → copy into `SUPABASE_PROJECT_ID`

### Step 4: Configure custom auth emails (Send Email Hook)

The spec requires custom-branded emails (not Supabase's default templates). Studio sends them via Resend, triggered by a Supabase Auth Hook.

1. In the Supabase dashboard, go to **Authentication → Hooks**.
2. Click **Add Hook**.
3. Hook type: **Send Email Hook**.
4. Hook URL: `https://your-deployment.vercel.app/api/auth/email-hook` (after deploying — see below).
5. Click **Save**. Supabase will show you a **webhook secret** that starts with `v1,whsec_...` — copy this into `SUPABASE_AUTH_HOOK_SECRET` in `.env.local`.
6. Go to **Authentication → Settings** and turn off Supabase's default email confirmation templates so they don't double-send (set them to inactive).

> While developing locally, the Send Email Hook can only point at a publicly-reachable URL. For local testing you can either deploy to Vercel first, or use a tunnel like ngrok to expose your local server.

### Step 5: Re-generate database types (optional)

If you ever change the schema, run this to regenerate the TypeScript types:

```bash
npm run supabase:types
```

## How To Get Your API Keys

You will collect keys from four services. Each step takes a couple of minutes.

### Hugging Face (for AI photo and video generation)

- **Sign up**: https://huggingface.co/join
- **Where to find your token**: Click your profile picture → **Settings** → **Access Tokens** → **Create new token** (Read access is enough)
- **Free tier**: Generous shared free inference. No card required. Rate limits are not officially published but usually a few hundred requests per day.
- **When you hit the free limit**: Inference calls return a 503 with a wait-time hint, or a 429. Studio shows the user "Model is warming up" and asks them to retry.
- **Goes in**: `HUGGINGFACE_API_TOKEN` (server-only — never exposed to the browser)

### Resend (for sending the welcome and password reset emails)

- **Sign up**: https://resend.com/
- **Where to find your API key**: Dashboard → **API Keys** → **Create API Key**
- **Free tier**: 3,000 emails per month, 100 per day.
- **Sender address**: Studio uses Resend's shared `onboarding@resend.dev` sender, which delivers to any recipient out of the box — no custom domain required. For production you would verify your own domain to improve deliverability (less likely to land in spam) and brand the sender, but it isn't needed to make the feature work.
- **Goes in**: `RESEND_API_KEY`

### Sentry (for error tracking — optional but recommended)

- **Sign up**: https://sentry.io/
- **Where to find your DSN**: Create a new project → choose "React" platform → copy the DSN shown.
- **Free tier**: 5,000 errors/month + 10k performance events/month.
- **When you hit the free limit**: Sentry stops accepting new events for the rest of the month; the app keeps running fine, you just stop seeing them.
- **Goes in**: `VITE_SENTRY_DSN` (browser) and `SENTRY_DSN` (server). They can be the same DSN.

### Vercel (for hosting)

- **Sign up**: https://vercel.com/
- **No API key needed** — you authenticate via the `vercel` CLI (`npx vercel login`) or via the dashboard when importing a GitHub repo.
- **Free tier**: Unlimited deploys, 100 GB bandwidth/month, serverless functions capped at 60s execution.

## How The App Works for Non-Technical Readers

1. You open the website and see a landing page with a "Get started" button.
2. You click sign up, enter an email and a password (8 characters or more), and submit.
3. Studio creates your account behind the scenes and asks Supabase to send a verification email. Supabase forwards that request to Studio's own email service (Resend) so you get a branded email instead of a generic one.
4. You click the link in your inbox. Studio confirms the link is valid and signs you in.
5. You land on your dashboard, which shows how many photos and videos you've made, how much storage you're using, and your two creation options.
6. You click "Generate photo", type "a quiet lake at sunrise", pick a style, and click Generate.
7. Studio's back-end sends your prompt to Hugging Face, an AI service that produces the image. While waiting, the screen shows a progress animation.
8. The image comes back as raw bytes. Studio uploads it to your private storage area and saves a small database row recording what you made, when, and which prompt you used.
9. The image appears on your screen with a Download button and a Save-to-library marker. It's already saved — the button is just to download a copy.
10. You go to "My library" to see everything you've made. You can filter by photos or videos, sort by date, copy a prompt, or delete anything you don't want anymore.
11. When you log out, your session ends. When you sign back in, everything is still there because it lives in the database, not on your computer.

## What Each Folder Does

| Folder | Plain-English description |
|---|---|
| `src/` | The front-end app — everything you see in the browser. |
| `src/features/` | One folder per major feature (auth, dashboard, generate, library, profile). Each contains the pages, the data-fetching code, and the small UI pieces specific to that feature. |
| `src/components/` | Shared UI building blocks used by many features — buttons, inputs, modals, the top navigation bar. |
| `src/lib/` | Plumbing: the connection to Supabase, the helper that calls the back-end API, environment variable validation, and Sentry initialization. |
| `src/styles/` | The design system: colour and font tokens, all the reusable component styles, and the app layout rules. |
| `src/types/` | TypeScript type definitions, including the auto-generated database types. |
| `api/` | The back-end. These files run on a server (Vercel) and handle things the browser shouldn't do directly — calling the AI service, sending emails, talking to the database with admin privileges. |
| `api/_lib/` | Server-side plumbing: environment validation, the Supabase admin client, the Hugging Face caller, error handling, Sentry. |
| `api/_email/` | The three email templates and the code that fills them in and sends them via Resend. |
| `api/auth/` | Handles Supabase's "send email" webhook and the rate-limited email-existence check used for login error messages. |
| `api/generate/` | The photo and video generation endpoints. |
| `api/profile/` | The GDPR account-deletion endpoint. |
| `supabase/migrations/` | The SQL files that set up the database schema, security rules, and storage buckets. |
| `Claude Design/` | The original design system reference (mockups, CSS tokens, component examples). The app reads from `src/styles/` which is the ported version. |

## Known Limitations

These are real constraints that the reviewer should know about up front.

### Email sender is a shared address (no custom domain verified)

Studio sends auth emails from Resend's shared `onboarding@resend.dev` address rather than a branded domain. Delivery to any recipient works fine on Resend's free tier, so signup, password reset, and "first creation" emails all reach the recipient's inbox. The cost of using the shared sender is deliverability: messages are more likely to land in the spam folder than they would from a verified custom domain. To unlock a verified branded sender (e.g. `noreply@yourdomain.com`), add a custom domain in Resend and add three DNS records — a 5-minute task and a cheap `.xyz` domain costs about $1/year.

### Video generation quality is constrained by the free Hugging Face video model

The video model used (`cerspense/zeroscope_v2_576w`) is free but produces short, low-resolution clips compared to commercial models like Runway or Kling. It also has notably slow cold starts — the first call after the model has been idle can take 60–90 seconds, which may exceed Vercel's free-tier 60-second function timeout. When this happens the UI shows a "Model is warming up — please try again in a minute" message, and the second attempt usually succeeds quickly. This is the honest cost of using a free tier; the architecture supports swapping the provider with a one-line change in `api/generate/video.ts` if higher quality is needed.

### File size limits

- Reference images for video generation: 5 MB maximum, JPG/PNG/WEBP only.
- Generated photos: typically 1–3 MB each.
- Generated videos: typically 1–5 MB each.

### Login error specificity vs email enumeration

To match the spec's UX requirement of distinct "No account found" vs "Incorrect password" error messages, Studio uses a rate-limited `/api/auth/check-email` endpoint that consults Supabase before submitting the login. This is a deliberate trade-off: it technically allows an attacker to enumerate which emails have accounts, but the endpoint is rate-limited to 5 requests per minute per IP. In a more security-sensitive context the safer choice would be the generic "Email or password is incorrect" used by mature auth providers.

## Security Decisions

A few decisions worth calling out:

- **Service-role key** (the secret one that bypasses Row Level Security) lives only on the server in Vercel environment variables. It is used in `api/_lib/supabase-admin.ts` and never imported from `src/`.
- **Row Level Security** is enabled on every table, with policies that restrict every read/write/delete to the owning user. The storage buckets enforce the same `{user_id}/{file}` path convention via storage RLS policies.
- **Email hook authenticity** is verified using the `standardwebhooks` library against the secret Supabase generates when you create the hook. Without a matching signature the endpoint returns 401.
- **JWT verification** on every `api/generate/*` and `api/profile/*` request uses Supabase's own `auth.getUser(token)` call — we never trust the JWT body without verifying.
- **GDPR account deletion** in `api/profile/delete.ts` explicitly lists and removes every storage object under the user's prefix in all three buckets *before* calling `auth.admin.deleteUser`, because Supabase Storage objects are not cascade-deleted from auth.user removal alone.
