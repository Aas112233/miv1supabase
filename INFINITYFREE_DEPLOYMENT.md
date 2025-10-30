# InfinityFree Deployment Guide

## ✅ Pre-Deployment Checklist

1. **Environment Variables Setup**
   - Ensure `.env` file exists in your project root
   - Contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - These will be baked into your build (this is normal and safe)

2. **Build the Project**
   ```bash
   npm run build
   ```
   This creates a `dist` folder with:
   - `index.html`
   - `assets/` folder (CSS, JS, images)
   - `.htaccess` (automatically copied)

## 📤 Upload to InfinityFree

### Step 1: Access File Manager
- Login to InfinityFree control panel
- Open File Manager or use FTP client (FileZilla)

### Step 2: Navigate to Public Folder
- Go to `htdocs` or `public_html` folder

### Step 3: Upload Files
Upload these files from your `dist` folder:
- ✅ `index.html`
- ✅ `assets/` folder (entire folder)
- ✅ `.htaccess`

**Important**: Upload to root of `htdocs`, not in a subfolder

### Step 4: Verify Upload
Your structure should look like:
```
htdocs/
├── index.html
├── .htaccess
└── assets/
    ├── index-abc123.js
    ├── index-xyz789.css
    └── [other files]
```

## 🔧 Troubleshooting

### Issue: 404 Error on Page Refresh
**Solution**: Make sure `.htaccess` is uploaded and mod_rewrite is enabled

### Issue: Blank White Screen
**Solution**: 
1. Check browser console for errors
2. Verify Supabase URL is correct in `.env` before building
3. Rebuild: `npm run build`

### Issue: "Cannot connect to Supabase"
**Solution**: 
1. Check `.env` file has correct values
2. Rebuild the project: `npm run build`
3. Re-upload all files

### Issue: Assets Not Loading (CSS/JS missing)
**Solution**: 
1. Make sure you uploaded the entire `assets/` folder
2. Check file permissions (should be 644 for files, 755 for folders)

## 🔄 Updating Your App

When you make changes:

1. **Make your code changes**
2. **Rebuild**: `npm run build`
3. **Delete old files** from InfinityFree
4. **Upload new files** from `dist` folder

**Pro Tip**: Only upload changed files to save time

## 🔐 Security Notes

- ✅ Your Supabase anon key is safe to be in JavaScript (it's public by design)
- ✅ Supabase Row Level Security (RLS) protects your data
- ❌ Never put service role key in frontend
- ✅ Session timeout (4 min) protects inactive sessions
- ✅ Auto-logout on browser close enabled

## 📱 Testing After Deployment

- [ ] Visit your site URL
- [ ] Test login functionality
- [ ] Navigate to different pages
- [ ] Refresh page (should not show 404)
- [ ] Test on mobile device
- [ ] Test logout
- [ ] Test session timeout

## 🌐 Custom Domain (Optional)

If using custom domain:
1. Point domain to InfinityFree nameservers
2. Wait for DNS propagation (24-48 hours)
3. Update Supabase allowed URLs if needed

## ⚡ Performance Tips

1. InfinityFree has bandwidth limits - monitor usage
2. Consider upgrading if you have many users
3. Supabase handles all backend (no server load on InfinityFree)
4. Images are served from InfinityFree - optimize them

## 📞 Support

- InfinityFree Forum: https://forum.infinityfree.com
- Supabase Docs: https://supabase.com/docs
