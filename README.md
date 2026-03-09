# Training HQ

Personal training tracker for masters athletes. Built with React + Vite + Supabase.

## Deploy to Vercel

### 1. Push to GitHub

```bash
cd training-hq
git init
git add .
git commit -m "Training HQ with Supabase auth"

# Create repo on github.com → New repository → "training-hq"
git remote add origin https://github.com/YOUR_USERNAME/training-hq.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **"Add New Project"**
3. Select `training-hq` repository
4. Click **Deploy** (Vite is auto-detected)
5. Your app is live at `https://training-hq.vercel.app`

### 3. Update Supabase redirect URL

1. Go to your Supabase project → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://training-hq.vercel.app`
3. Under **Redirect URLs**, add: `https://training-hq.vercel.app`

This ensures magic link emails redirect to the correct URL.

### 4. Add to iPhone home screen

1. Open your Vercel URL in Safari
2. Tap Share → "Add to Home Screen"
3. Works as a standalone app

## Local Development

```bash
npm install
npm run dev
```

## Architecture

- **Auth:** Supabase Auth (magic link + email/password)
- **Data:** localStorage for instant reads, Supabase Postgres for sync
- **Sync:** Writes debounced (1.5s) to Supabase after every change
- **Security:** Row Level Security ensures users only access own data
