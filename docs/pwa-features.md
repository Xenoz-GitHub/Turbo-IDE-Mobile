# PWA Features & Capabilities

## Overview

Turbo C++ Mobile is a fully-featured Progressive Web App (PWA) with advanced capabilities for both Android and iOS platforms.

---

## Manifest Configuration

### App Identity

- **App ID**: `/` (unique identifier)
- **Name**: Turbo C++ Mobile
- **Short Name**: Turbo C++
- **Package ID** (Android): `com.encryptedcrew.turbocpp`

### Display Modes

**Primary**: `standalone`
- Runs in a separate window
- No browser UI visible
- Feels like a native app

**Fallbacks**: 
1. `fullscreen` - Immersive full-screen experience
2. `minimal-ui` - Minimal browser UI with back button
3. `browser` - Standard browser tab (last resort)

---

## Advanced Features

### 1. App Shortcuts

Long-press the app icon to access quick actions:

- **Launch Web IDE** - Open IDE directly
- **New C++ Project** - Create new file immediately
- **Open Sample Programs** - Browse examples
- **Settings** - Access configuration

**Implementation:**
```typescript
// URL routing for shortcuts
/#ide?action=new       // New project
/#ide?action=samples   // Sample programs
/#ide?action=settings  // Settings panel
```

### 2. File Handling

Open `.cpp`, `.c`, `.h` files directly in the app:

**Supported MIME types:**
- `text/x-c++src` - C++ source files (.cpp, .cxx, .cc)
- `text/x-csrc` - C source files (.c)
- `text/x-chdr` - Header files (.h, .hpp, .hxx)

**How it works:**
1. User opens a .cpp file from file manager
2. System offers "Open with Turbo C++ Mobile"
3. File opens directly in the IDE

### 3. Share Target

Receive shared text and files from other apps:

**Accepts:**
- Text snippets (code)
- URLs (links to code)
- Files (.cpp, .c, .h files)

**Example use cases:**
- Share code from GitHub mobile → Opens in IDE
- Share .cpp file from email → Opens directly
- Share code snippet from messaging app

### 4. Protocol Handler

Custom URL scheme: `web+turbocpp://`

**Examples:**
```
web+turbocpp://code=YOUR_CODE_HERE
web+turbocpp://open?file=example.cpp
web+turbocpp://share?url=https://example.com/code.cpp
```

**Use cases:**
- Deep linking from websites
- Integration with documentation
- Sharing code via links

### 5. Launch Handler

Smart window management:

- **navigate-existing**: Reuse existing app window
- **auto**: System decides best behavior

**Behavior:**
- If app is open → Navigate to new content
- If app is closed → Open new window
- Prevents multiple instances

### 6. Link Handling

App can intercept and handle links:

```
handle_links: "preferred"
```

**Works for:**
- Links clicked in emails
- Links from other apps
- QR codes with URLs

---

## Icons & Visual Assets

### App Icons

**Standard Icons:**
- 192x192 PNG (any purpose)
- 512x512 PNG (any purpose)
- Scalable SVG (any size)

**Maskable Icon:**
- 512x512 PNG (adaptive icon for Android)
- Safe zone: 40% center area
- Full bleed design

### Screenshots

**Desktop** (1280x720):
- Wide form factor
- Shows full IDE interface
- BGI graphics support

**Mobile** (720x1280):
- Narrow form factor
- Virtual keyboard visible
- Touch-optimized UI

---

## Platform-Specific Features

### Android

**WebAPK Generation:**
- Chrome auto-generates signed APK
- Installs as system app
- Full integration with Android

**Capabilities:**
- App drawer icon
- Recent apps integration
- Share menu integration
- Notification support
- Background sync

### iOS (Safari)

**Add to Home Screen:**
- Dedicated home screen icon
- Standalone window mode
- No Safari UI visible

**Optimizations:**
- Status bar styling
- Safe area insets
- Viewport fit=cover
- Splash screen support

**Limitations:**
- No automatic updates
- Manual re-add required
- No background sync
- Limited file system access

---

## Offline Capabilities

### Service Worker Caching

**Precached Assets:**
- HTML, CSS, JavaScript
- App icons and logos
- Offline fallback page
- Critical resources

**Runtime Caching:**
- User-created files
- Sample programs
- Settings data
- Recent projects

**Cache Strategies:**
1. **Cache First** - Navigation & assets
2. **Network First** - API calls
3. **Stale While Revalidate** - Resources

### Storage

**LocalStorage:**
- User projects (localStorage)
- Settings and preferences
- File metadata
- Last active file

**Limits:**
- ~5-10 MB per origin
- Varies by browser
- Can request quota increase

---

## Auto-Update System

### Update Detection

**Service Worker:**
- Checks every 30 minutes
- On app resume/focus
- Manual check available

**Version Manifest API:**
```
GET /api/version
{
  "version": "1.0.1",
  "versionCode": 2,
  "changelog": [...],
  "downloadUrl": "/api/download/apk"
}
```

### Update Flow

**Android WebAPK:**
1. New version detected
2. User shown update notification
3. Downloads new APK
4. System prompts installation
5. Updates automatically

**iOS PWA:**
1. New version detected
2. User shown update banner
3. Instructions to re-add to home screen
4. Manual update required

---

## Installation Analytics

### Tracking Events

**Install Events:**
```javascript
{
  version: "1.0.0",
  platform: "android" | "ios-pwa" | "desktop",
  device: "phone" | "tablet",
  timestamp: ISO8601,
  installMethod: "webapk" | "add-to-home" | "manual-apk"
}
```

**Usage Metrics:**
- App launches
- Session duration
- Feature usage
- Update adoption rate

---

## Performance Optimizations

### Load Time

- **First Paint**: < 1s
- **Interactive**: < 2s
- **Full Load**: < 3s

**Techniques:**
- Code splitting
- Lazy loading
- Tree shaking
- Compression (gzip/brotli)

### Runtime Performance

- Virtual scrolling for file lists
- Debounced auto-save
- Web Workers for compilation
- RequestIdleCallback for bg tasks

---

## Security Features

### HTTPS Required

PWA requires HTTPS for:
- Service Worker registration
- Geolocation API
- Camera/Microphone
- Push notifications
- Payment Request

### Content Security Policy

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
```

### Permissions

**Required:**
- None (works without permissions)

**Optional:**
- Storage (for quota increase)
- Notifications (for updates)
- File system access (experimental)

---

## Testing PWA

### Lighthouse Audit

```bash
npm run build
npx lighthouse https://turbo-ide.vercel.app --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 90+
- PWA: 100

### PWABuilder Validation

Visit: https://www.pwabuilder.com/?site=https://turbo-ide.vercel.app

**Checks:**
- Manifest validation
- Service worker detection
- HTTPS enforcement
- Icons & screenshots
- Store readiness

---

## Browser Support

### Full PWA Support

- **Chrome** 79+ (Android, Desktop)
- **Edge** 79+ (Windows, macOS)
- **Samsung Internet** 11+ (Android)
- **Opera** 66+ (Android, Desktop)

### Partial Support

- **Safari** 15.4+ (iOS, macOS)
  - No Web Push
  - No background sync
  - Manual updates only

### Not Supported

- Firefox (no install prompt)
- IE11 (end of life)
- Old Chrome (<79)

---

## Future Enhancements

### Planned Features

1. **Web Bluetooth** - Connect to hardware
2. **Web USB** - Serial communication
3. **Web NFC** - Tag reading
4. **Background Sync** - Offline compilation
5. **Periodic Background Sync** - Auto-update check
6. **Web Share Level 2** - Share files from app
7. **File System Access API** - Direct file editing

### Android Exclusive

- **WebAPK Update Protocol** - Seamless updates
- **TWA** (Trusted Web Activity) - Play Store
- **Shortcuts API** - Dynamic shortcuts
- **Badging API** - Notification count

---

## Troubleshooting

### PWA Not Installing

**Android:**
- Open in Chrome (not in-app browser)
- Visit site at least 2 times
- Wait 5 minutes between visits
- Ensure stable internet

**iOS:**
- Must use Safari
- Cannot install from Instagram, Facebook, etc.
- Follow "Add to Home Screen" manually

### Updates Not Working

**Check:**
- Service worker is registered
- /api/version endpoint is reachable
- Version numbers are incrementing
- Clear cache and hard reload

---

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWABuilder](https://www.pwabuilder.com/)

---

**Credits:** ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
