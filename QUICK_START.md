# 🚀 Turbo C++ Mobile - Quick Start Guide

## ✅ Setup Complete!

Your application has been built and is ready for deployment. Here's what's been done:

### ✓ Completed Steps
- ✅ Dependencies installed (576 packages)
- ✅ Web/PWA built successfully (`dist/` directory)
- ✅ Android platform configured
- ✅ Capacitor synced to Android
- ✅ Environment configured (.env.local)

---

## 🎯 What You Can Do Now

### Option 1: Run Locally (Immediate)

**Start Development Server:**
```powershell
npm run dev
```
Then open: http://localhost:3000

**Start Backend Server:**
```powershell
npm run server
```
Backend runs on: http://localhost:3001

### Option 2: Deploy to Vercel (Recommended - Free)

1. **Install Vercel CLI:**
```powershell
npm install -g vercel
```

2. **Login to Vercel:**
```powershell
vercel login
```

3. **Deploy:**
```powershell
vercel --prod
```

4. **Your app will be live at:** `https://your-project.vercel.app`

### Option 3: Build Android APK

**Prerequisites:**
- Android Studio installed
- Java JDK 17+ installed
- Android SDK configured

**Option A: Debug APK (Quick Test)**
```powershell
cd android
.\gradlew assembleDebug
```
APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

**Option B: Signed Release APK**

First, generate keystore:
```powershell
keytool -genkey -v -keystore release-key.keystore -alias turbo-cpp-key -keyalg RSA -keysize 2048 -validity 10000
```

Then build:
```powershell
# Automated (recommended)
npm run build:apk

# Or manual
cd android
.\gradlew assembleRelease
```

---

## 📱 Testing the PWA

### On Your Computer:
1. Run: `npm run dev`
2. Open Chrome: http://localhost:3000
3. Click install icon in address bar
4. App installs as PWA

### On Android Phone:
1. Deploy to Vercel (see Option 2 above)
2. Open your Vercel URL in Chrome
3. Tap "Install app" from menu
4. App installs as WebAPK

### On iPhone/iPad:
1. Deploy to Vercel
2. Open your Vercel URL in Safari
3. Tap Share → Add to Home Screen
4. App adds to home screen

---

## 🔧 Configuration

### Update App Version
Edit `src/config/version.ts`:
```typescript
export const APP_VERSION = {
  version: '1.0.1',  // Change this
  versionCode: 2,    // Increment this
  // ...
};
```

### Set API URL
Edit `.env.local`:
```env
VITE_API_URL=https://your-vercel-url.vercel.app
```

---

## 📂 Project Structure

```
turbo-cpp-ide-mobile/
├── dist/                    # Built web app (ready to deploy)
├── android/                 # Android native project
├── src/                     # React source code
│   ├── components/         # UI components
│   ├── utils/              # Utilities (updateService, etc.)
│   ├── hooks/              # React hooks
│   └── config/             # Version & config
├── server/                  # Backend API (Express)
├── public/                  # Static assets
│   ├── manifest.webmanifest
│   ├── sw-custom.js        # Service worker
│   └── ...
├── docs/                    # Documentation
├── scripts/                 # Build scripts
└── package.json
```

---

## 🌐 URLs After Deployment

Once deployed to Vercel, you'll have:
- **Main App**: `https://your-project.vercel.app`
- **Direct IDE**: `https://your-project.vercel.app/#ide`
- **Version API**: `https://your-project.vercel.app/api/version`
- **APK Download**: `https://your-project.vercel.app/api/download/apk`

---

## 🎨 Features Ready to Use

- ✅ Full Borland Turbo C++ 3.0 IDE
- ✅ graphics.h (640x480 VGA graphics)
- ✅ conio.h (console functions)
- ✅ dos.h (system functions, PC speaker)
- ✅ Touch virtual keyboard
- ✅ Offline support (PWA)
- ✅ File import/export
- ✅ Auto-updates (when deployed)
- ✅ Android APK generation
- ✅ iOS PWA support

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Build Errors
```powershell
# Clean and rebuild
npm run clean
rm -rf node_modules
npm install
npm run build
```

### Android Build Fails
- Ensure Java JDK 17 is installed
- Set JAVA_HOME environment variable
- Install Android SDK via Android Studio

---

## 📞 Support

- **Documentation**: Check `docs/` folder
- **Issues**: GitHub Issues (if repository exists)
- **Developer**: Suarez J. (XenozExe)
- **Team**: ENCRYPTED CREW

---

## 🎯 Recommended Next Steps

1. **Deploy to Vercel** (5 minutes)
   - Free hosting
   - Auto HTTPS
   - Global CDN
   - Auto-updates work

2. **Test on Real Devices**
   - Android phone (Chrome)
   - iPhone/iPad (Safari)
   - Desktop (Chrome/Edge)

3. **Build APK** (Optional)
   - For offline distribution
   - For Google Play Store
   - For Samsung Galaxy Store

4. **Custom Domain** (Optional)
   - Buy domain (Namecheap, GoDaddy)
   - Add to Vercel project
   - Configure DNS

---

## 🚀 Deploy Command Cheatsheet

```powershell
# Local Development
npm run dev              # Start dev server
npm run server          # Start backend

# Build
npm run build           # Build web/PWA
npm run build:apk       # Build Android APK

# Deploy
vercel --prod           # Deploy to Vercel
netlify deploy --prod   # Deploy to Netlify

# Capacitor
npx cap sync android    # Sync web to Android
npx cap open android    # Open in Android Studio
```

---

## ✨ You're Ready!

Everything is set up and working. Choose your deployment path and go live!

**Happy Coding!** 💻🎯

---

**Built with ❤️ by ENCRYPTED CREW**
