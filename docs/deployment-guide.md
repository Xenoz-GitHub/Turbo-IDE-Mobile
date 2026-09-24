# Deployment & Update Guide

## Overview

This guide covers the complete deployment and update workflow for Turbo C++ Mobile across all platforms.

---

## Version Management

### Update Version Number

Edit `src/config/version.ts`:

```typescript
export const APP_VERSION = {
  version: '1.0.1',        // Increment this
  versionCode: 2,          // Increment this
  buildDate: '2026-09-25', // Update date
  releaseChannel: 'stable',
  codeName: 'Borland Legacy',
} as const;
```

**Version Numbering:**
- **Major** (X.0.0) - Breaking changes, major features
- **Minor** (1.X.0) - New features, backward compatible
- **Patch** (1.0.X) - Bug fixes, small improvements

**Version Code:**
- Must increment with every release
- Used for update detection
- Never reuse or decrement

### Update Changelog

Add entry to `VERSION_HISTORY` in `src/config/version.ts`:

```typescript
{
  version: '1.0.1',
  versionCode: 2,
  releaseDate: '2026-09-25',
  changes: [
    'Fixed graphics.h rendering bug',
    'Improved keyboard responsiveness',
    'Added new sample programs'
  ],
  breaking: false,   // Set true if breaking changes
  critical: false,   // Set true if security/critical fix
}
```

---

## Building for Production

### 1. Web/PWA Build

```bash
# Install dependencies
npm install

# Build production assets
npm run build

# Preview build locally
npm run preview
```

**Output:** `dist/` directory

### 2. Android APK Build

```bash
# Full build (web + APK)
npm run build:apk

# Debug APK only
npm run build:apk:debug

# Release APK only (requires keystore)
npm run build:apk:release
```

**Output:** `builds/turbo-cpp-mobile.apk`

### 3. Server Build

```bash
# Build web assets first
npm run build

# Start production server
npm run server
```

---

## Deployment Platforms

### Option 1: Vercel (Recommended)

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

**Environment Variables:**
```
VITE_API_URL=https://turbo-ide.vercel.app
APP_VERSION=1.0.0
VERSION_CODE=1
GEMINI_API_KEY=your_key_here
```

### Option 2: Netlify

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "server"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Option 4: Self-Hosted (VPS)

**Using PM2:**
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start npm --name "turbo-cpp" -- run server

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

**Using Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "server"]
```

---

## APK Distribution

### Method 1: Direct Download (Current)

1. Build APK: `npm run build:apk`
2. Upload to server: `scp builds/turbo-cpp-mobile.apk user@server:/app/builds/`
3. Server serves at: `/api/download/apk`
4. Users download and install manually

### Method 2: Google Play Store

**Steps:**
1. Generate signed APK with keystore
2. Create App Bundle: `./gradlew bundleRelease`
3. Sign up for Google Play Console
4. Create app listing
5. Upload .aab file
6. Submit for review

**Requirements:**
- Google Play Developer account ($25 one-time fee)
- Privacy policy URL
- App icon, screenshots, description
- Content rating questionnaire
- Target API level 33+

### Method 3: Alternative App Stores

- **F-Droid** - Free, open-source only
- **Amazon Appstore** - Amazon devices
- **Samsung Galaxy Store** - Samsung devices
- **Huawei AppGallery** - Huawei devices

---

## Update Deployment Workflow

### Step 1: Prepare Release

```bash
# Update version in config
# Update changelog
# Test thoroughly
npm run lint
npm run build
npm run build:apk
```

### Step 2: Deploy Web/PWA

```bash
# Deploy to hosting platform
vercel --prod
# or
netlify deploy --prod
```

### Step 3: Upload APK

```bash
# Upload new APK to server
scp builds/turbo-cpp-mobile.apk user@server:/app/builds/

# Or use SCP/SFTP client
# Or upload via web dashboard
```

### Step 4: Update Server Version

Edit `server/index.ts` or set environment variables:

```bash
export APP_VERSION=1.0.1
export VERSION_CODE=2
```

Restart server:
```bash
pm2 restart turbo-cpp
```

### Step 5: Verify Update

```bash
# Check version endpoint
curl https://turbo-ide.vercel.app/api/version

# Expected response:
{
  "version": "1.0.1",
  "versionCode": 2,
  "releaseDate": "...",
  "downloadUrl": "/api/download/apk",
  "changelog": [...]
}
```

---

## Update Notifications

### How Users Get Updates

**Android WebAPK:**
1. Service worker checks `/api/version` every 30 min
2. If `versionCode` > current, shows update notification
3. User taps "Update" → Downloads new APK
4. Android prompts to install update
5. App updates automatically

**iOS PWA:**
1. Service worker detects new version
2. Shows update banner with instructions
3. User must manually re-add to home screen
4. Closes old app, opens new version

**Web Browser:**
1. Service worker detects new version
2. Shows "Reload to Update" notification
3. User clicks → Page reloads
4. New version loads from cache

### Force Updates

For critical security updates, set `critical: true` in version manifest:

```typescript
const VERSION_MANIFEST = {
  version: '1.0.1',
  versionCode: 2,
  critical: true,  // Force update
  // ...
};
```

This displays a non-dismissible update dialog with 10-second countdown.

---

## Rollback Procedure

### If Update Has Issues

**Web/PWA:**
```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous version
git checkout v1.0.0
vercel --prod
```

**Android APK:**
1. Replace APK with previous version on server
2. Decrement `VERSION_CODE` temporarily
3. Users on new version must uninstall and reinstall
4. Or wait for fixed update

**Prevention:**
- Always test thoroughly before release
- Use staging environment
- Gradual rollout (Vercel allows this)
- Keep backups of working APKs

---

## Monitoring & Analytics

### Track Installations

Backend receives install events at `/api/analytics/install`:

```typescript
{
  version: "1.0.0",
  platform: "android",
  timestamp: "2026-09-24T...",
  userAgent: "..."
}
```

### Monitor Update Adoption

```bash
# Query backend logs
grep "analytics/install" /var/log/app.log | \
  jq -r '.version' | \
  sort | uniq -c
```

### Error Tracking

Use services like:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Google Analytics** - Usage metrics

---

## Testing Checklist

Before deploying:

- [ ] Version number incremented
- [ ] Changelog updated
- [ ] All tests passing
- [ ] Build succeeds (web + APK)
- [ ] PWA manifest valid
- [ ] Service worker registers
- [ ] Update detection works
- [ ] APK installs correctly
- [ ] iOS PWA works
- [ ] Offline mode functional
- [ ] All shortcuts work
- [ ] File handling works
- [ ] No console errors

---

## Continuous Integration

### GitHub Actions Example

`.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web
        run: npm run build
      
      - name: Build APK
        run: npm run build:apk
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: turbo-cpp-mobile.apk
          path: builds/turbo-cpp-mobile.apk
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: builds/turbo-cpp-mobile.apk
```

---

## Troubleshooting

### Updates Not Detected

**Check:**
1. Version endpoint is accessible: `curl /api/version`
2. Version code is higher than current
3. Service worker is registered
4. User has internet connection
5. CORS is configured correctly

### APK Won't Install

**Check:**
1. APK file is not corrupted (verify size)
2. Signatures match if updating
3. User has storage space
4. Android version is API 22+ (5.1+)
5. "Unknown Sources" is enabled

### PWA Won't Update

**Check:**
1. Service worker has update available
2. User has closed all tabs
3. Browser cache is clear
4. HTTPS is working
5. Manifest hasn't changed drastically

---

## Best Practices

1. **Test on Real Devices** - Emulators aren't enough
2. **Gradual Rollouts** - Deploy to 10% → 50% → 100%
3. **Monitor Errors** - Watch for crashes after deploy
4. **Keep Backups** - Save working APKs and builds
5. **Document Changes** - Clear changelog for users
6. **Version Tags** - Tag releases in git: `git tag v1.0.1`
7. **Semantic Versioning** - Follow SemVer principles
8. **Test Updates** - Install old version, then update
9. **Communication** - Notify users of major changes
10. **Rollback Plan** - Always have a way back

---

## Support & Maintenance

### Regular Tasks

**Weekly:**
- Check error logs
- Monitor update adoption
- Review user feedback

**Monthly:**
- Security updates
- Dependency updates
- Performance optimization

**Quarterly:**
- Major feature releases
- UI/UX improvements
- Platform updates

---

**Credits:** ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
