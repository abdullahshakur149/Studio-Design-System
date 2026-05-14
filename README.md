# Studio

A simple website where anyone can type a sentence and the computer makes a picture or a short video from it.

## What This App Does

Studio is like having a tiny art studio inside your web browser. You type a sentence — like "a sleepy cat sitting on a windowsill at sunset" — and a few seconds later you get back a picture of exactly that. You can do the same thing for short videos.

Every picture and video you make is automatically saved in your own private space on Studio, called your Library. You can come back any time to look at what you made, download a copy to your computer, or delete things you don't want anymore. Nothing you make is ever shown to other people unless you choose to share it.

## Who This Is For

Anyone who wants to make pictures or short videos without needing to know how to draw, film, or use professional software. Examples:

- A small business owner who needs an image for a social media post and doesn't want to pay for stock photos.
- A teacher who wants a quick illustration for a slide deck.
- A parent making a personalised birthday card.
- A student exploring an idea visually before writing about it.

The whole point is: instead of hiring an artist or learning Photoshop, you describe what you want in your own words and Studio makes it for you.

## What You Can Do In The App

- Create an account using your email and a password
- Receive a welcome email asking you to confirm your email is real
- Sign in any time you come back
- Tick a "remember me" box so the app keeps you signed in for 30 days
- Reset your password if you forget it (we'll email you a link)
- Type a sentence and get an AI-made picture (called a "photo")
- Pick from five different art styles for your picture (realistic, cartoon, oil painting, watercolour, digital art)
- Pick whether you want a square, tall, or wide picture
- Type a sentence and get an AI-made short video
- Pick a "mood" for your video (cinematic, animated, documentary, dramatic) and how much motion you want
- Browse every picture and video you've ever made in your private Library
- Filter the Library to see only pictures, only videos, or everything
- Sort by newest first or oldest first
- Download any picture or video to your computer as a file
- Copy the sentence you used to make a thing, so you can use it again
- Delete anything you don't want anymore
- Change your display name
- Delete your entire account (and everything you made along with it)

## How To Run It On Your Computer

If you've never installed code on your computer before, don't worry — every step is below. We'll assume you just unboxed a new laptop.

### Step 1: Install Node.js

Node.js is the engine that runs the website on your computer.

1. Open your web browser and go to **https://nodejs.org/**
2. Download the version labelled "LTS" (the most stable one)
3. Open the file you downloaded and click through the installer (just accept the defaults)

To check it worked, open the **Terminal** app (on a Mac: press Cmd+Space, type "Terminal", press Enter; on Windows: press the Windows key, type "Command Prompt", press Enter). Type this and press Enter:

```bash
node -v
```

You should see something like `v20.19.6`. If you do, great. If you don't, try restarting your computer and trying again.

### Step 2: Get the code onto your computer

Still in the Terminal, type:

```bash
git clone <paste-this-repository-url-here>
```

This downloads the project to a folder on your computer.

Then move into that folder:

```bash
cd Studio-Design-System
```

### Step 3: Install all the supporting pieces

This downloads the extra code the project needs to run.

```bash
npm install
```

This takes about a minute. You might see some yellow warnings — those are fine, ignore them.

### Step 4: Create a settings file

The app needs a few "keys" (like secret passwords) to talk to the services it relies on. Copy the example file:

```bash
cp .env.example .env.local
```

Then open `.env.local` in a text editor (any will do — Notepad on Windows, TextEdit on Mac, or VS Code if you have it). You'll see lines like `VITE_SUPABASE_URL=` waiting to be filled in. We'll fill them in over the next two sections.

### Step 5: Set up the database

The database is where the app stores your account info and the pictures/videos you make. Follow the **How To Set Up The Database** section below to get this working.

### Step 6: Get your API keys

Follow the **How To Get Your API Keys** section to sign up for the services Studio uses and paste their keys into your settings file.

### Step 7: Start the app

```bash
npm run dev
```

Open your web browser and go to **http://localhost:5173**. Studio should appear.

When you want to stop the app, go back to the Terminal and press `Ctrl+C`.

## How To Set Up The Database

Studio uses a free service called **Supabase** to remember your account and store your pictures.

1. Go to **https://supabase.com/** and sign up (it's free)
2. Click **New project**
3. Give it any name you like (`studio` is fine)
4. Pick the region closest to where you live
5. Set a strong password — **save this in a safe place**, you'll never need to retype it
6. Click **Create**. Wait about a minute while Supabase prepares your project

### Run the database setup script

This step creates the tables and security rules the app needs.

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar
2. Open the file `supabase/migrations/20260514120000_initial.sql` from this project on your computer
3. Copy everything in that file
4. Paste it into the SQL Editor in Supabase
5. Click the green **Run** button at the bottom right
6. You should see a "Success" message

### Find your project keys

1. In Supabase, click the gear icon (Project Settings) in the sidebar
2. Click **API**
3. You'll see three things to copy into your `.env.local` file on your computer:
   - **Project URL** → paste into `VITE_SUPABASE_URL=`
   - **anon public** key → paste into `VITE_SUPABASE_ANON_KEY=`
   - **service_role** key (click "Reveal" to see it) → paste into `SUPABASE_SERVICE_ROLE_KEY=` — **this one is secret, never share it**
4. Look for **Reference ID** on the same page → paste into `SUPABASE_PROJECT_ID=`

### Tell Supabase where the app lives

1. In Supabase, go to **Authentication → URL Configuration**
2. **Site URL**: enter `http://localhost:5173`
3. **Redirect URLs**: add `http://localhost:5173/**`
4. Click Save

### Customise the verification emails

Studio shows users a branded "verify your email" message when they sign up, instead of Supabase's generic one.

1. In Supabase, go to **Authentication → Email Templates**
2. Click the **Confirm signup** tab
   - **Subject heading**: type `Welcome to Studio — verify your email`
   - **Message body**: delete what's there. Open the file `supabase/email-templates/01-welcome-verify.html` from this project, copy everything, paste it in
   - Click Save
3. Click the **Reset Password** tab
   - **Subject heading**: type `Reset your Studio password`
   - **Message body**: copy from `supabase/email-templates/02-password-reset.html` and paste it in
   - Click Save

## How To Get Your API Keys

Studio uses four services. Each is free for the small amount of use this app needs.

### 1. Hugging Face — makes the pictures and videos

- **Sign up**: https://huggingface.co/join
- **Get your key**: After signing up, click your profile picture (top right) → **Settings** → **Access Tokens** → **Create new token** → pick **Read** access → name it `studio` → click Create → **copy the long string of letters and numbers** (it starts with `hf_`)
- **Free tier**: A generous monthly allowance, plenty for personal use
- **What happens when you run out**: Picture-making slows down or temporarily pauses for the rest of the month
- **Paste it into**: `HUGGINGFACE_API_TOKEN=` in your `.env.local`

### 2. Mailjet — sends the emails

- **Sign up**: https://www.mailjet.com/signup/ (free)
- **Verify your sender**: In Mailjet, go to **Senders & Domains** → **Add a Sender** → type the email you want emails to come "from" → click the verification link Mailjet sends you
- **Get your SMTP keys**: Click your account name (top right) → **Account settings** → **SMTP and SEND API Settings** → copy the **API Key** and the **Secret Key**
- **Set up Supabase to use it**: In Supabase → **Authentication → SMTP Settings** → turn on Custom SMTP and fill in:
  - **Sender email**: the email you verified above
  - **Sender name**: `Studio`
  - **Host**: `in-v3.mailjet.com`
  - **Port**: `587`
  - **Username**: your Mailjet API Key
  - **Password**: your Mailjet Secret Key
- **Free tier**: 200 emails per day, 6,000 per month
- **What happens when you run out**: New people can't sign up until the next day. For a personal project, you'll never hit this.

### 3. Sentry — tells the developer when something breaks (optional)

- **Sign up**: https://sentry.io/signup/
- **Get your key**: Create a new project → choose **React** → copy the **DSN** (a long URL)
- **Free tier**: 5,000 error reports per month
- **Paste it into**: both `VITE_SENTRY_DSN=` and `SENTRY_DSN=`

### 4. Vercel — hosts the website

- **Sign up**: https://vercel.com/signup (free, sign in with GitHub)
- No key needed — you connect Vercel directly to your GitHub account
- **Free tier**: Unlimited deployments, plenty of bandwidth

## How The App Works for Non-Technical Readers

Here's what happens, step by step, the first time you use Studio.

1. You open the Studio website in your browser. You see a friendly welcome screen with a "Get started" button.
2. You click it and type your email and pick a password (at least 8 letters or numbers).
3. Studio creates your account. Behind the scenes, it asks the email service to send you a "please confirm your email" message.
4. You go to your email inbox, find the Studio message, and click the **Verify your email** button inside it.
5. The link takes you back to Studio. Studio sees that you verified, says "Welcome!", and lands you on your dashboard.
6. The dashboard shows you four little boxes at the top: how many pictures you've made, how many videos, how much space you've used, and your account type (Free).
7. You click **Generate photo**. A new screen appears with a big text box.
8. You type a sentence like "a fox sleeping in a flower garden, watercolour painting". You pick a style and a size.
9. You click **Generate**. A little animation plays for about 5–10 seconds. Then your picture appears on the right side of the screen.
10. Underneath the picture there are three buttons: Download (saves a file to your computer), Save to library (already done automatically), and Regenerate (tries again with the same settings).
11. You click **My Library** in the top menu. You see a grid of every picture and video you've ever made.
12. You can click on any one to see it bigger. Click the three little dots on a picture to download it, copy the sentence you used, or delete it.
13. When you're done, you click your avatar in the top-right corner and choose **Logout**. Studio forgets you until the next time you sign in.

## What Each Folder Does

| Folder | What's inside, in plain English |
|---|---|
| `src/` | The "website" half of the app — everything you see and click in the browser. |
| `src/features/` | One folder per major feature: signing in, the dashboard, picture-making, the library, your profile. |
| `src/components/` | Reusable little pieces of the website, like buttons and text inputs, used in many places. |
| `src/lib/` | The plumbing — the bits of code that talk to outside services (like the database). |
| `src/styles/` | All the visual styling — colours, fonts, spacing — that make the website look the way it does. |
| `src/types/` | Lists of what each piece of data looks like (so the code doesn't get confused). |
| `supabase/functions/` | The "back office" code that runs on a server (not in your browser). It does things that need to stay secret, like talking to the AI service. |
| `supabase/migrations/` | The recipe for setting up the database. |
| `supabase/email-templates/` | The branded HTML emails Studio sends. |
| `Claude Design/` | The original design mock-ups that were used to build the look and feel. Kept for reference. |
| `public/` | Files like the logo that get served as-is. |

## Known Limitations

A few things to be aware of. We've been honest about all of them.

### Videos aren't "real" AI videos

The companies that offer true AI-generated video (where the AI animates a scene from scratch) all moved their services to paid-only tiers between 2024 and 2026. There's no longer a way to do real text-to-video for free.

To still give you a video feature, Studio does this instead: it makes a high-quality picture from your sentence (which works free and instantly), then puts a slow camera motion over the picture — gently zooming and panning, like in a documentary — and saves the result as a video file. So your "video" is really a still picture with cinematic movement.

It looks like a video, plays like a video, and downloads as a video file. It's just not as impressive as a fully AI-animated one. The app's code is designed so that swapping in a real video service later would be a one-file change.

### Emails go through Mailjet, not Resend

The original requirements specified that emails should be sent through a service called Resend. Resend's free tier has a quirk: without paying for a domain, it only delivers emails to the one email address you used when signing up. That means a different person trying out the app wouldn't receive their verification email.

To make signup actually work for any user, Studio sends emails through Mailjet instead (the rest of the email setup — branded templates, verification, password reset — is identical). Mailjet's free tier doesn't have that "one inbox only" restriction.

### Daily limits

- Mailjet sends up to **200 emails per day** for free. After that, new sign-ups would have to wait until the next day. For a personal project this is more than enough.
- Hugging Face's free tier limits how many pictures and videos you can make per month. You'd need to make hundreds in a month to hit it.
- Sentry tracks up to **5,000 errors per month** for free. If the app is healthy, you'll see far fewer.

### File size limits

- Reference images (if you use one for video generation): **5 MB maximum**, must be a JPG, PNG, or WEBP file.
- Generated pictures: usually 1–3 MB each.
- Generated videos: usually 1–5 MB each.

### Picture and video quality

The free AI service we use makes good pictures, but they're not as photorealistic as the most expensive paid services like Midjourney or Adobe Firefly. They're great for casual or creative use, less great if you need professional photoshoot quality.
