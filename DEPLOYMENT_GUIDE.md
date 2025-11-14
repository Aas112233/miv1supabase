# Deployment Guide - Investment Club App

## Build Status
✅ **Build Completed Successfully**
- Build time: ~8 seconds
- Output size: 1.19 MB (312 KB gzipped)
- CSS size: 111 KB (17 KB gzipped)

---

## Files Generated

### dist/ folder contains:
```
dist/
├── index.html
├── .htaccess
└── assets/
    ├── index-64c3635c.css
    └── index-2aa78d76.js
```

---

## Deployment Steps

### Option 1: Apache Server (Shared Hosting)

1. **Upload Files**
   - Upload entire `dist/` folder contents to your web root
   - Common paths: `public_html/`, `www/`, `htdocs/`

2. **Verify .htaccess**
   - Ensure `.htaccess` file is uploaded
   - Check file permissions: `644`

3. **Configure Environment**
   - Ensure your `.env` variables are set on server
   - Or update Supabase credentials in build

4. **Test**
   - Visit your domain
   - Test routing: `/dashboard`, `/members`, etc.
   - Check browser console for errors

### Option 2: Netlify

1. **Connect Repository**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

2. **Configure Redirects**
   - Create `dist/_redirects` file:
   ```
   /*    /index.html   200
   ```

3. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 3: Vercel

1. **Deploy**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configure**
   - Vercel automatically handles SPA routing
   - Add environment variables in dashboard

### Option 4: GitHub Pages

1. **Update vite.config.js**
   ```javascript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   git add dist -f
   git commit -m "Deploy"
   git subtree push --prefix dist origin gh-pages
   ```

---

## .htaccess Configuration

### Features Included:

✅ **React Router Support**
- All routes redirect to index.html
- Handles client-side routing

✅ **Compression (mod_deflate)**
- Compresses JS, CSS, HTML, fonts
- Reduces bandwidth by ~70%

✅ **Browser Caching (mod_expires)**
- Images: 1 year
- CSS/JS: 1 month
- HTML: No cache (always fresh)

✅ **Security Headers**
- X-Frame-Options: Prevents clickjacking
- X-XSS-Protection: XSS protection
- X-Content-Type-Options: Prevents MIME sniffing
- Referrer-Policy: Privacy protection

✅ **Additional Security**
- Directory browsing disabled
- Hidden files protected
- X-Powered-By header removed

### Optional: Force HTTPS

Uncomment these lines in `.htaccess`:
```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Environment Variables

### Required Variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Production Setup:

**Option A: Build with variables**
```bash
# Set variables before build
set VITE_SUPABASE_URL=https://xxx.supabase.co
set VITE_SUPABASE_ANON_KEY=your_key
npm run build
```

**Option B: Server environment**
- Set variables in hosting control panel
- Rebuild app on server

---

## Post-Deployment Checklist

### 1. Verify Routing
- [ ] Home page loads
- [ ] `/dashboard` works
- [ ] `/members` works
- [ ] `/login` works
- [ ] Browser back/forward buttons work

### 2. Check Functionality
- [ ] Login works
- [ ] Session monitoring active
- [ ] Device management functional
- [ ] Member-user linking works
- [ ] All CRUD operations work

### 3. Test Security
- [ ] HTTPS enabled (if applicable)
- [ ] Session termination works
- [ ] Device blocking works
- [ ] User blocking works

### 4. Performance
- [ ] Page load time < 3 seconds
- [ ] Assets compressed (check Network tab)
- [ ] Images optimized
- [ ] No console errors

### 5. Mobile Testing
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Forms usable on mobile

---

## Troubleshooting

### Issue: 404 on page refresh

**Solution:** Ensure `.htaccess` is uploaded and mod_rewrite is enabled

```apache
# Check if this is in .htaccess
RewriteRule . /index.html [L]
```

### Issue: Blank page after deployment

**Solution:** Check browser console for errors
- Verify Supabase credentials
- Check CORS settings in Supabase
- Ensure all assets loaded

### Issue: Assets not loading

**Solution:** Check base path in `vite.config.js`
```javascript
base: '/', // Should be '/' for root domain
```

### Issue: Slow loading

**Solution:** 
- Verify compression is enabled
- Check browser caching headers
- Use CDN for assets

### Issue: Session monitoring not working

**Solution:**
- Check localStorage is enabled
- Verify Supabase connection
- Check browser console for errors

---

## Server Requirements

### Minimum Requirements:
- Apache 2.4+ or Nginx
- PHP 7.4+ (if using PHP backend)
- SSL Certificate (recommended)
- mod_rewrite enabled (Apache)
- mod_deflate enabled (Apache)
- mod_expires enabled (Apache)
- mod_headers enabled (Apache)

### Enable Apache Modules:
```bash
# On Ubuntu/Debian
sudo a2enmod rewrite
sudo a2enmod deflate
sudo a2enmod expires
sudo a2enmod headers
sudo systemctl restart apache2
```

---

## Nginx Configuration (Alternative)

If using Nginx instead of Apache:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

## Monitoring & Maintenance

### Regular Tasks:
1. **Check Error Logs**
   - Review server error logs weekly
   - Monitor Supabase logs

2. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

3. **Backup Database**
   - Regular Supabase backups
   - Export user data monthly

4. **Monitor Performance**
   - Use Google PageSpeed Insights
   - Check Core Web Vitals

5. **Security Updates**
   - Keep Supabase SDK updated
   - Review blocked users/devices
   - Audit session logs

---

## Rollback Procedure

If deployment fails:

1. **Keep Previous Build**
   ```bash
   # Before deploying
   copy dist dist_backup /E
   ```

2. **Restore**
   ```bash
   # If issues occur
   rmdir dist /S /Q
   move dist_backup dist
   ```

3. **Verify**
   - Test all functionality
   - Check error logs

---

## Support

For deployment issues:
1. Check server error logs
2. Review browser console
3. Verify Supabase connection
4. Test .htaccess configuration
5. Contact hosting support

---

## Build Information

**Build Command:** `npm run build`
**Output Directory:** `dist/`
**Build Tool:** Vite 4.5.14
**Framework:** React 18+
**Backend:** Supabase

**Last Build:** Check `dist/` folder timestamp
**Version:** 1.0

---

## Quick Deploy Commands

```bash
# Build
npm run build

# Deploy to server (example using SCP)
scp -r dist/* user@server:/var/www/html/

# Or using FTP
# Upload dist/* to your hosting via FileZilla/WinSCP

# Verify
curl https://yourdomain.com
```

---

**Deployment Complete!** 🚀

Your Investment Club app is ready for production.
