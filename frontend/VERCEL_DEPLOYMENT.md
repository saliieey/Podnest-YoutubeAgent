# Vercel Deployment Fixes

## Issues Fixed

1. **Dynamic Rendering**: Added `export const dynamic = 'force-dynamic'` to pages using `useSearchParams()` to prevent static generation issues
2. **Environment Variable Checks**: Added safety checks for missing environment variables in API calls
3. **Build-time API Calls**: Prevented API calls during build time by checking for `window` object and environment variables
4. **Suspense Boundaries**: Wrapped `useSearchParams()` usage in Suspense for better error handling

## Required Environment Variables in Vercel

Make sure to add these environment variables in your Vercel project settings:

1. **NEXT_PUBLIC_API_BASE_URL** - Your backend API URL (e.g., `https://your-backend.vercel.app` or `http://your-backend-domain.com`)
2. **NEXT_PUBLIC_N8N_WEBHOOK_BASE** - Your N8N webhook base URL (e.g., `https://n8n.srv810314.hstgr.cloud/webhook`)
3. **NEXT_PUBLIC_GOOGLE_DRIVE_DOWNLOAD_URL** - Google Drive download URL (e.g., `https://drive.google.com/uc?export=download`)

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the `NEXT_PUBLIC_` prefix for client-side access
4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Redeploy your application

## Build Configuration

The project now includes:
- `vercel.json` - Vercel-specific configuration
- Dynamic rendering for pages with search params
- Error handling for missing environment variables

## Testing the Build Locally

Before deploying, test the build locally:

```bash
cd frontend
npm run build
```

If the build succeeds, you're ready to deploy to Vercel!

