# Deployment Instructions

## Prerequisites Completed

- ✅ Project built successfully
- ✅ Security measures implemented
- ✅ Documentation completed
- ✅ Gemini references removed
- ✅ Professional README created

---

## Step 1: Push to GitHub

### Initialize Git (if not already done)

```bash
git init
```

### Add Remote Repository

```bash
git remote add origin https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile.git
```

### Stage All Files

```bash
git add .
```

### Commit Changes

```bash
git commit -m "Initial release: Turbo C++ Mobile v1.0.0 with comprehensive security implementation"
```

### Push to GitHub

```bash
git push -u origin main
```

**Note:** If the branch is named differently, use:
```bash
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Link Project:**
   ```bash
   vercel link
   ```
   - Select your account
   - Link to existing project or create new one

3. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

4. **Verify Deployment:**
   - Check the output URL
   - Visit https://turbo-ide.vercel.app
   - Test PWA installation
   - Verify security headers

### Option B: Using Vercel Dashboard

1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub: `Xenoz-GitHub/Turbo-IDE-Mobile`
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Environment Variables (Optional):
   ```
   NODE_ENV=production
   PORT=3001
   ```

6. Click "Deploy"

---

## Step 3: Verify Deployment

### Check List

- [ ] Website loads at https://turbo-ide.vercel.app
- [ ] PWA manifest accessible: `/manifest.webmanifest`
- [ ] Service worker registered: `/sw-custom.mjs`
- [ ] Digital Asset Links: `/.well-known/assetlinks.json`
- [ ] Security headers present (check browser dev tools)
- [ ] Install prompt works on Android Chrome
- [ ] API endpoints functional:
  - [ ] GET `/api/version`
  - [ ] GET `/api/health`
  - [ ] POST `/api/generate-twa`
- [ ] Rate limiting active
- [ ] No console errors
- [ ] Lighthouse score 90+

### Test Commands

```bash
# Check manifest
curl https://turbo-ide.vercel.app/manifest.webmanifest

# Check health
curl https://turbo-ide.vercel.app/api/health

# Check version
curl https://turbo-ide.vercel.app/api/version

# Check Digital Asset Links
curl https://turbo-ide.vercel.app/.well-known/assetlinks.json

# Check security headers
curl -I https://turbo-ide.vercel.app
```

---

## Step 4: Post-Deployment Tasks

### 1. Update Digital Asset Links

After generating your release keystore:

1. Get SHA256 fingerprint:
   ```bash
   keytool -list -v -keystore release-key.keystore -alias turbo-cpp-release
   ```

2. Update `public/.well-known/assetlinks.json`:
   ```json
   {
     "sha256_cert_fingerprints": [
       "YOUR_ACTUAL_SHA256_FINGERPRINT_HERE"
     ]
   }
   ```

3. Redeploy to Vercel:
   ```bash
   git add public/.well-known/assetlinks.json
   git commit -m "Update Digital Asset Links with release certificate"
   git push
   ```

### 2. Test PWA Installation

**On Android:**
1. Open Chrome
2. Visit https://turbo-ide.vercel.app
3. Tap menu → "Install app"
4. Verify app appears in app drawer
5. Test offline functionality

**On iOS:**
1. Open Safari
2. Visit https://turbo-ide.vercel.app
3. Tap share → "Add to Home Screen"
4. Verify app launches

### 3. Monitor Security

```bash
# Check for vulnerabilities
npm run security:audit

# Monitor logs (Vercel dashboard)
# - Check for suspicious activity
# - Monitor rate limit hits
# - Review error logs
```

### 4. Performance Monitoring

- **Vercel Analytics:** Enable in dashboard
- **Lighthouse:** Run weekly audits
- **Real User Monitoring:** Set up in Vercel

---

## Step 5: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys on push to `main` branch.

**Workflow:**
1. Make changes locally
2. Commit: `git commit -m "Description"`
3. Push: `git push`
4. Vercel auto-deploys
5. Check deployment at dashboard

### Preview Deployments

Pull requests automatically get preview URLs:
1. Create feature branch: `git checkout -b feature/new-feature`
2. Push: `git push origin feature/new-feature`
3. Create PR on GitHub
4. Vercel generates preview URL
5. Test before merging

---

## Troubleshooting

### Build Fails

**Issue:** Vite build fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Fails

**Issue:** Vercel deployment error
1. Check build logs in Vercel dashboard
2. Verify all dependencies in package.json
3. Check for missing environment variables
4. Review .gitignore (dist/ should not be committed)

### Security Headers Missing

**Issue:** CSP or other headers not working
1. Verify helmet.js in server/index.ts
2. Check Vercel uses server correctly
3. Add vercel.json if needed:
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-Content-Type-Options", "value": "nosniff" }
         ]
       }
     ]
   }
   ```

### Rate Limiting Not Working

**Issue:** Too many requests getting through
1. Verify express-rate-limit middleware
2. Check server logs
3. Test with curl:
   ```bash
   for i in {1..20}; do curl https://turbo-ide.vercel.app/api/version; done
   ```

### PWA Not Installing

**Issue:** Install prompt doesn't appear
1. Check manifest at `/manifest.webmanifest`
2. Verify service worker at `/sw-custom.mjs`
3. Check browser console for errors
4. Use Chrome DevTools → Application → Manifest
5. Ensure HTTPS is working

---

## Environment Variables

### Production (Vercel Dashboard)

Set these in Vercel Dashboard → Settings → Environment Variables:

```
NODE_ENV=production
```

Optional:
```
PORT=3001
VITE_ANALYTICS_ENABLED=true
```

### Local Development

Already configured in `.env.local`

---

## DNS Configuration (Custom Domain)

### Add Custom Domain to Vercel

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `yourdomain.com`
3. Follow DNS instructions
4. Wait for propagation (up to 48 hours)

### Update Configuration

After custom domain is active:

1. Update `hostUrl` in TWA generator
2. Update Digital Asset Links
3. Update README links
4. Update social media links

---

## Monitoring & Maintenance

### Weekly Tasks

- [ ] Check Vercel analytics
- [ ] Review error logs
- [ ] Run security audit: `npm run security:audit`
- [ ] Check for dependency updates: `npm outdated`
- [ ] Test PWA installation
- [ ] Monitor rate limit effectiveness

### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Run Lighthouse audit
- [ ] Review security logs
- [ ] Check GitHub security advisories
- [ ] Test APK builds
- [ ] Verify Digital Asset Links

### Quarterly Tasks

- [ ] Full security audit
- [ ] Penetration testing (optional)
- [ ] Performance optimization review
- [ ] Update documentation
- [ ] Review and update dependencies

---

## Support

- **GitHub Issues:** https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile/issues
- **Documentation:** See README.md and security docs
- **Vercel Support:** support@vercel.com

---

## Success Criteria

✅ **Deployment Complete When:**
- Website accessible at production URL
- PWA installs on mobile devices
- Service worker caches assets
- Security headers present
- Rate limiting active
- No console errors
- Lighthouse score 90+
- Digital Asset Links accessible
- All API endpoints functional

---

**Deployment Status:** Ready to Deploy

**Next Steps:**
1. Push to GitHub
2. Deploy to Vercel using CLI or dashboard
3. Verify deployment checklist
4. Test PWA installation
5. Monitor analytics and logs

**ENCRYPTED CREW © 2026**
