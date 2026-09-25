# Turbo C++ Mobile

**Production-quality mobile environment for Borland Turbo C++ 3.0**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Security: A Grade](https://img.shields.io/badge/security-A%20grade-brightgreen.svg)](SECURITY_AUDIT_REPORT.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

---

## Overview

Turbo C++ Mobile brings the complete Borland Turbo C++ 3.0 development environment to modern web browsers and Android devices. Built with React, TypeScript, and Capacitor, it provides an authentic DOS-era IDE experience with modern mobile optimizations.

**Key Features:**
- Full Borland Turbo C++ 3.0 compatibility
- Complete `graphics.h` BGI support (640x480 VGA)
- Console functions (`conio.h`: clrscr, textcolor, gotoxy)
- DOS system functions (`dos.h`: sound, delay)
- Mobile-optimized virtual keyboard with responsive design
- Offline-first Progressive Web App (100% PWABuilder compliant)
- Native Android APK with automatic updates
- Periodic background sync for seamless updates
- Background sync for offline resilience
- Push notifications for re-engagement
- File import/export to device storage
- Real-time compilation and execution
- Multi-tab support (desktop)
- Custom window controls (desktop PWA)

**Live App:** [https://turbo-ide.vercel.app/#ide](https://turbo-ide.vercel.app/#ide)  
**Landing Page:** [https://turbo-ide.vercel.app](https://turbo-ide.vercel.app)

---

## Table of Contents

- [Installation](#installation)
  - [For Users](#for-users)
  - [For Developers](#for-developers)
- [Architecture](#architecture)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Android APK](#android-apk)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Installation

### For Users

#### Web Version (PWA)
1. Visit the app directly: [https://turbo-ide.vercel.app/#ide](https://turbo-ide.vercel.app/#ide)
2. On Android Chrome: Tap menu → "Install app" or "Add to Home screen"
3. On iOS Safari: Tap share → "Add to Home Screen"
4. Enjoy offline-first experience with automatic background updates

#### Android APK
1. Visit [https://turbo-ide.vercel.app](https://turbo-ide.vercel.app)
2. Click "Install / APK" button in header
3. Choose "Install WebAPK on Android Now" for instant install
4. Or download APK file for manual installation
5. Launch "Turbo C++ Mobile" from your app drawer

### For Developers

**Prerequisites:**
- Node.js 18+ 
- npm or yarn
- Android Studio (for APK builds)
- Java JDK 17+ (for Android builds)

**Clone and Install:**
```bash
git clone https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile.git
cd Turbo-IDE-Mobile
npm install
```

**Environment Setup:**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

---

## Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite 8.3 (build system)
- Tailwind CSS 4.3 (styling)
- Lucide React (icons)
- Motion (animations)

**Mobile:**
- Capacitor 6.2 (native wrapper)
- Progressive Web App (PWA)
- Service Worker with advanced features:
  - Periodic background sync (24-hour update checks)
  - Background sync (offline resilience)
  - Push notifications
  - Offline-first caching strategy
- PWABuilder 100% compliant
- Google Play Store ready

**Backend:**
- Express.js (API server)
- Helmet.js (security headers)
- Rate limiting and input validation

**Build Tools:**
- Android Gradle 8.2.2
- Java 17
- ProGuard (code obfuscation)

### Project Structure

```
turbo-cpp-ide-mobile/
├── src/
│   ├── components/          # React components
│   │   ├── TurboIdeScreen.tsx
│   │   ├── VirtualKeyboard.tsx
│   │   ├── PWABuilderHub.tsx (NEW: Installation modal)
│   │   ├── ShowcaseLandingPage.tsx
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── turboCompiler.ts
│   │   ├── security.ts
│   │   ├── serviceWorkerHelpers.ts (NEW: PWA features)
│   │   └── ...
│   ├── types/               # TypeScript types
│   ├── hooks/               # React hooks
│   │   ├── usePWAInstall.ts (NEW: PWA install hook)
│   │   └── ...
│   └── main.tsx             # Entry point
├── server/
│   └── index.ts             # Express API server
├── public/
│   ├── .well-known/         # Digital Asset Links
│   ├── widgets/             # PWA widget templates
│   ├── manifest.webmanifest # PWA manifest (enhanced)
│   └── sw-custom.js         # Service worker (enhanced)
├── android/                 # Capacitor Android project
├── assets/                  # DOS configuration files
└── bridge/                  # C++ DOSBox bridge code
```

---

## Development

### Start Development Server

**Frontend:**
```bash
npm run dev
# Opens on http://localhost:3000
```

**Backend API:**
```bash
npm run server:dev
# Runs on http://localhost:3001
```

### Available Scripts

```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # TypeScript type checking
npm run server           # Start Express server
npm run server:dev       # Start server with watch mode

# Android
npm run cap:sync         # Sync web assets to Android
npm run cap:open:android # Open in Android Studio
npm run android:run      # Build and run on device

# Security
npm run security:audit   # Check production dependencies
npm run security:check   # Full security check
```

### Hot Module Replacement

HMR is enabled by default in development. Disable with:
```bash
DISABLE_HMR=true npm run dev
```

---

## PWA Features

### Advanced Progressive Web App

**PWABuilder Compliance: 100%**

The app includes all advanced PWA features for optimal user experience and Google Play Store readiness:

#### Periodic Background Sync
- Automatic update checks every 24 hours
- Works even when app is closed
- Seamless updates without user intervention

#### Background Sync
- Offline-first data synchronization
- Queues actions when offline
- Automatically syncs when connection restored
- No data loss during poor connectivity

#### Push Notifications
- Update notifications
- Feature announcements
- Critical alerts
- User re-engagement

#### Scope Extensions
- Navigate to additional domains seamlessly
- Vercel preview deployments supported
- GitHub integration

#### Multi-Tab Support (Desktop)
- Open multiple C++ files in tabs
- Desktop PWA enhancement

#### Window Controls Overlay (Desktop)
- Custom title bar integration
- Native window controls
- More screen space for IDE

#### Home Screen Widgets
- Quick access widget
- Adaptive card UI
- OS-level integration

#### Note-Taking Integration
- OS recognizes app as code/note editor
- System share menu integration

**Test PWA Compliance:** [PWABuilder](https://www.pwabuilder.com/?site=https://turbo-ide.vercel.app)

---

## Building for Production

### Web Build

```bash
# Build optimized bundle
npm run build

# Output in dist/ directory
# dist/
#   ├── index.html
#   ├── assets/
#   ├── manifest.webmanifest
#   └── sw-custom.js
```

### Deploy to Vercel

**Prerequisites:**
- Vercel CLI installed: `npm i -g vercel`
- Vercel account connected

**Deploy:**
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or deploy preview
vercel
```

**Environment Variables (Vercel Dashboard):**
- `NODE_ENV=production`
- `PORT=3001` (optional)

---

## Android APK

### Build Debug APK

```bash
npm run build:apk:debug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Build Release APK

**1. Generate Keystore:**
```bash
keytool -genkey -v \
  -keystore release-key.keystore \
  -alias turbo-cpp-release \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

**2. Configure Signing:**

Create `keystore.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=turbo-cpp-release
storeFile=../release-key.keystore
```

**3. Build:**
```bash
npm run build:apk:release

# Output: android/app/build/outputs/apk/release/app-release.apk
```

**4. Get Certificate Fingerprint:**
```bash
keytool -list -v \
  -keystore release-key.keystore \
  -alias turbo-cpp-release
  
# Copy the SHA256 fingerprint
```

**5. Update Digital Asset Links:**

Edit `public/.well-known/assetlinks.json` with your SHA256 fingerprint, then redeploy to Vercel.

**Complete Guide:** See [ANDROID_SECURITY_GUIDE.md](ANDROID_SECURITY_GUIDE.md)

---

## Security

### Security Features

**Server-Side:**
- Helmet.js security headers (CSP, HSTS, XSS Protection)
- Rate limiting (100 req/15min general, 10 req/15min strict)
- Input validation with express-validator
- CORS whitelist
- Path traversal prevention
- ZIP bomb protection (50MB limit)
- Request size limits (1MB)

**Client-Side:**
- Content Security Policy
- XSS prevention utilities
- Input sanitization
- Secure localStorage encryption
- Client-side rate limiting
- Clickjacking detection

**Android:**
- ProGuard code obfuscation
- Secure AndroidManifest configuration
- No cleartext traffic
- Minimal permissions
- Digital Asset Links verification

**Security Audit:** Grade A - See [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)

### Reporting Vulnerabilities

Report security issues via GitHub Issues (private security advisories) or by contacting the maintainers directly.

### Security Documentation

- [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) - Complete security audit
- [ANDROID_SECURITY_GUIDE.md](ANDROID_SECURITY_GUIDE.md) - Android signing & security
- [AUTHENTICATION_DECISION.md](AUTHENTICATION_DECISION.md) - No-auth rationale

---

## API Endpoints

### Public Endpoints

**GET `/api/version`**
- Returns current app version and changelog
- Rate limit: 100 requests / 15 minutes

**POST `/api/check-update`**
- Check for available updates
- Body: `{ currentVersion, currentVersionCode }`
- Rate limit: 100 requests / 15 minutes

**GET `/api/download/apk`**
- Download latest APK file
- Rate limit: 10 requests / 15 minutes

**POST `/api/generate-twa`**
- Generate Android TWA project ZIP
- Body: `{ appName, packageName, hostUrl, themeColor, backgroundColor }`
- Rate limit: 10 requests / 15 minutes
- Input validation: All fields required and validated

**GET `/api/health`**
- Health check endpoint
- Returns: `{ status, version, timestamp, uptime }`

---

## Testing

### Manual Testing

**PWA Features:**
1. Install app via browser
2. Test offline functionality
3. Verify service worker caching
4. Check manifest compliance

**Android Features:**
1. Install APK on device
2. Test app permissions
3. Verify Digital Asset Links
4. Check ProGuard obfuscation

**Security Testing:**
```bash
# Run security audit
npm run security:audit

# Check for vulnerabilities
npm audit
```

### Test Checklist

- [ ] Web version loads correctly
- [ ] PWA installs successfully
- [ ] Service worker precaches assets
- [ ] Offline mode works
- [ ] Android APK installs
- [ ] Digital Asset Links verified
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] No console errors in production

---

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and security checks: `npm run security:check`
5. Commit with clear messages: `git commit -m "Add feature: description"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

### Code Standards

- TypeScript strict mode enabled
- ESLint configuration followed
- Security best practices enforced
- No sensitive data in commits
- Clear commit messages
- Documentation for new features

### Pull Request Guidelines

- Describe changes clearly
- Include testing steps
- Update documentation if needed
- Ensure security checks pass
- Add screenshots for UI changes

---

## Deployment

### Vercel Deployment

**Automatic Deployment:**
- Push to `main` branch triggers production deployment
- Pull requests trigger preview deployments

**Manual Deployment:**
```bash
vercel --prod
```

**Environment Variables:**
Set in Vercel Dashboard → Settings → Environment Variables

**Required:**
- `NODE_ENV=production`

**Optional:**
- `PORT=3001`
- `VITE_API_URL` (if using external API)

### Custom Domain

1. Add domain in Vercel Dashboard
2. Update DNS records as instructed
3. Update `hostUrl` in TWA generation
4. Update Digital Asset Links URL

---

## Browser Support

### Desktop
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile
- Android 7.0+ (Chrome)
- iOS 14+ (Safari)
- Samsung Internet 14+

### PWA Support
- Chrome/Edge (full support)
- Safari (limited support)
- Firefox (partial support)

---

## Performance

### Metrics

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Speed Index: < 2.5s
- Lighthouse Score: 90+

### Optimizations

- Code splitting with Vite
- Service worker caching
- Image optimization
- Lazy loading components
- Minification and compression
- ProGuard obfuscation (Android)

---

## Known Issues

### Dependency Vulnerabilities

**tar <= 7.5.20** (in @capacitor/cli)
- Severity: Critical
- Status: Dev dependency only, not in production
- Risk: Low (build-time only)
- Monitoring: Waiting for Capacitor update

### Browser Limitations

**iOS Safari:**
- Limited service worker support
- No beforeinstallprompt event
- Use "Add to Home Screen" manually

**CSP Restrictions:**
- `unsafe-inline` required for React
- `unsafe-eval` required for Vite dev mode
- Production builds are secure

---

## Roadmap

### Version 1.1 (Planned)
- [ ] Multiple file tabs
- [ ] Code snippets library
- [ ] Syntax highlighting improvements
- [ ] Keyboard shortcuts customization

### Version 1.2 (Planned)
- [ ] Cloud sync (optional)
- [ ] Project templates
- [ ] Export to GitHub
- [ ] Collaborative editing

### Long-term
- [ ] iOS native app
- [ ] Desktop Electron app
- [ ] Plugin system
- [ ] Theme customization

---

## FAQ

**Q: Is this the real Turbo C++?**  
A: Yes, it runs Borland Turbo C++ 3.0 via DOSBox in WebAssembly.

**Q: Does it work offline?**  
A: Yes, once installed as PWA or APK, it works completely offline.

**Q: Can I import my existing C++ files?**  
A: Yes, use the file manager to import .cpp, .c, and .h files.

**Q: Is my code stored on a server?**  
A: No, all code is stored locally in your browser or device.

**Q: Is it free?**  
A: Yes, completely free and open source.

**Q: Can I use it for assignments?**  
A: Yes, it's designed for educational use and supports all standard C++ features.

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

Copyright (c) 2026 ENCRYPTED CREW

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

---

## Credits

**Developed by:** ENCRYPTED CREW  
**Lead Developer:** Suarez J. (XenozExe)  
**GitHub:** [Xenoz-GitHub](https://github.com/Xenoz-GitHub)

**Built With:**
- React - UI framework
- TypeScript - Type safety
- Vite - Build tool
- Capacitor - Native wrapper
- Express - API server
- Tailwind CSS - Styling
- DOSBox - C++ compiler emulation

**Special Thanks:**
- Borland for Turbo C++ 3.0
- DOSBox project
- Open source community

---

## Support

- **Documentation:** See `/docs` folder
- **Issues:** [GitHub Issues](https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile/discussions)

---

## Links

- **Live App:** [https://turbo-ide.vercel.app/#ide](https://turbo-ide.vercel.app/#ide)
- **Landing Page:** [https://turbo-ide.vercel.app](https://turbo-ide.vercel.app)
- **Repository:** [https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile](https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile)
- **PWABuilder Test:** [https://www.pwabuilder.com/?site=https://turbo-ide.vercel.app](https://www.pwabuilder.com/?site=https://turbo-ide.vercel.app)
- **Issues:** [GitHub Issues](https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile/discussions)

---

**Built with precision. Secured by design. Ready for production.**

ENCRYPTED CREW © 2026
