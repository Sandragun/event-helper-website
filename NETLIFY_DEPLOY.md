# Netlify Deployment Guide

## Quick Fix for White Page Issue

If you're seeing a white page on Netlify, follow these steps:

### 1. Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `VITE_GEMINI_API_KEY` = Your Google Gemini API key (needed for the chatbot)

### 2. Build Settings

In Netlify dashboard → **Site settings** → **Build & deploy**:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18` (or latest LTS)

### 3. Redeploy

After setting environment variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

## Common Issues

### White Page After Deployment

**Cause**: Missing environment variables or routing issues

**Solution**:
1. ✅ Check environment variables are set in Netlify
2. ✅ Check browser console for errors (F12)
3. ✅ Verify `netlify.toml` and `public/_redirects` are in your repo
4. ✅ Clear Netlify cache and redeploy

### Routing Not Working

**Cause**: Netlify needs redirect rules for SPA routing

**Solution**: 
- The `netlify.toml` and `public/_redirects` files are already configured
- These redirect all routes to `index.html` for client-side routing

### Build Fails

**Cause**: Missing dependencies or build errors

**Solution**:
1. Check build logs in Netlify dashboard
2. Ensure `package.json` has all dependencies
3. Try building locally: `npm run build`

## Verification Steps

1. **Check Environment Variables**:
   - Netlify Dashboard → Site settings → Environment variables
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY` should be set

2. **Check Build Logs**:
   - Netlify Dashboard → Deploys → Click on latest deploy
   - Look for any errors or warnings

3. **Check Browser Console**:
   - Open your deployed site
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Look for messages about missing Supabase or Gemini environment variables

4. **Test the App**:
   - Visit your Netlify URL
   - You should see the Events page (homepage)
   - Try navigating to `/auth` route
   - Check if Supabase connection works
   - Open the chatbot and verify it responds (requires Gemini key)

## Manual Deployment

If automatic deployment isn't working:

```bash
# Build locally
npm run build

# The dist folder contains your built files
# You can drag and drop the dist folder to Netlify
```

## Troubleshooting

### Still seeing white page?

1. **Check browser console** - Look for JavaScript errors
2. **Check Network tab** - Verify all assets are loading
3. **Check Supabase connection** - Ensure environment variables are correct
4. **Check build output** - Verify `dist/index.html` exists after build

### Environment Variables Not Working?

- Make sure variable names start with `VITE_` (required for Vite)
- Redeploy after adding/changing environment variables
- Clear Netlify cache before redeploying

### Chatbot says Gemini key missing

- Add `VITE_GEMINI_API_KEY` in the Netlify environment settings
- Redeploy with cache cleared

### Need Help?

Check the browser console for specific error messages and share them for debugging.

