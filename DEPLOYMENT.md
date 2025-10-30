# Deployment Guide

## Prerequisites
- Supabase project created and configured
- Database schema deployed (from `/sql` directory)
- Environment variables ready

## Environment Variables Required

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Options

### Option 1: Netlify (Recommended)

1. **Connect Repository**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` with your Supabase URL
   - Add `VITE_SUPABASE_ANON_KEY` with your Supabase anon key

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

### Option 2: Vercel

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your Git repository

2. **Configure Project**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables**
   - In project settings → Environment Variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy"

### Option 3: AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your Git repository

2. **Configure Build**
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Set Environment Variables**
   - Go to App Settings → Environment Variables
   - Add your Supabase credentials

4. **Deploy**

## Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Verify database connections
- [ ] Check all API endpoints
- [ ] Test role-based access control
- [ ] Verify session timeout works
- [ ] Test on mobile devices
- [ ] Check browser compatibility

## Troubleshooting

**Issue**: "Cannot connect to Supabase"
- Solution: Verify environment variables are set correctly in hosting platform

**Issue**: "Build fails"
- Solution: Check that all dependencies are in `package.json`
- Run `npm install` locally to verify

**Issue**: "404 on refresh"
- Solution: Add `_redirects` file (Netlify) or `vercel.json` (Vercel) for SPA routing

## Security Notes

- Never commit `.env` file to Git
- Use Supabase Row Level Security (RLS) policies
- Keep your anon key public-safe (it's meant to be exposed)
- Protect your service role key (never expose in frontend)
