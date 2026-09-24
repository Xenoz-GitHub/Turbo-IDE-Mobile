# APK Build & Distribution Guide

## Overview

This guide explains how to build, sign, and distribute the Turbo C++ Mobile Android APK with automatic update capabilities.

---

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Android Studio** with:
   - Android SDK (API 34)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
3. **Java JDK** (17 or higher)
4. **Gradle** (will be downloaded automatically)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install Capacitor and all required dependencies.

### 2. Initialize Capacitor (First Time Only)

```bash
npx cap init
```

Follow the prompts:
- App name: `Turbo C++ Mobile`
- App ID: `com.encryptedcrew.turbocpp`
- Web directory: `dist`

### 3. Add Android Platform

```bash
npx cap add android
```

### 4. Build the Web App

```bash
npm run build
```

### 5. Sync to Android

```bash
npx cap sync android
```

---

## Building APK

### Option A: Automated Build Script (Recommended)

```bash
npm run build:apk
```

This script will:
1. Clean previous builds
2. Build the React application
3. Sync with Capacitor
4. Build both debug and release APKs (if keystore exists)
5. Copy APKs to `builds/` directory

### Option B: Manual Build

**Debug APK:**
```bash
npm run build:apk:debug
```

**Release APK:**
```bash
npm run build:apk:release
```

---

## Signing Release APK

### Step 1: Generate Keystore

```bash
keytool -genkey -v -keystore release-key.keystore \
  -alias turbo-cpp-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Important:** Store the keystore password securely! You'll need it for future updates.

### Step 2: Configure Gradle

Create `android/keystore.properties`:

```properties
storeFile=../release-key.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=turbo-cpp-key
keyPassword=YOUR_KEY_PASSWORD
```

### Step 3: Update build.gradle

Edit `android/app/build.gradle` to load keystore properties:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

---

## Distribution Setup

### 1. Server Deployment

Your Express server (`server/index.ts`) serves APKs at `/api/download/apk`.

**Deploy to Vercel/Netlify/Railway:**

```bash
# Build production assets
npm run build

# Start server
npm run server
```

### 2. Upload APK

After building, upload the APK to your server's `builds/` directory:

```bash
# Create builds directory on server
mkdir -p builds

# Copy local APK to server
scp builds/turbo-cpp-mobile.apk user@yourserver:/path/to/app/builds/
```

### 3. Update Version Manifest

Edit `server/index.ts` and update the `VERSION_MANIFEST`:

```typescript
const VERSION_MANIFEST: VersionManifest = {
  version: '1.0.1',  // Increment version
  versionCode: 2,     // Increment version code
  releaseDate: new Date().toISOString(),
  downloadUrl: '/api/download/apk',
  changelog: [
    'New feature: XYZ',
    'Bug fix: ABC',
    'Performance improvements'
  ],
  minVersion: '1.0.0',
  critical: false  // Set to true for critical updates
};
```

---

## Auto-Update Flow

### How It Works

1. **App launches** → Checks `/api/check-update` endpoint
2. **Server responds** with version info and changelog
3. **If update available** → User sees update notification
4. **User taps "Update"** → Downloads new APK from `/api/download/apk`
5. **Android prompts** user to install the update
6. **User confirms** → App updates automatically

### Update Checking

The app checks for updates:
- On app launch
- Every 1 hour while running
- When user manually checks in Settings

### Force Updates

For critical security updates:

```typescript
VERSION_MANIFEST.critical = true;
```

This will show a persistent update dialog that users cannot dismiss.

---

## Testing

### Install Debug APK

```bash
# Via ADB
adb install builds/turbo-cpp-mobile-debug.apk

# Or manually transfer and install
```

### Test Auto-Update

1. Install version 1.0.0
2. Update server version to 1.0.1
3. Open app → Update notification should appear
4. Tap "Update" → APK downloads and prompts for install

---

## Google Play Store Submission

### Generate App Bundle

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Play Store Assets

You'll need:
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (mobile + tablet)
- Privacy policy URL
- App description

### Digital Asset Links

For App Links support, host `.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.encryptedcrew.turbocpp",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

Get SHA-256 fingerprint:

```bash
keytool -list -v -keystore release-key.keystore -alias turbo-cpp-key
```

---

## Troubleshooting

### Build Fails

```bash
# Clean Gradle cache
cd android
./gradlew clean

# Rebuild
./gradlew assembleDebug
```

### APK Not Installing

- Check Android version (minimum API 22 / Android 5.1)
- Enable "Install from Unknown Sources" in Settings
- Verify APK is not corrupted (check file size)

### Update Not Working

- Check server is accessible
- Verify `/api/version` returns correct data
- Check browser console for errors
- Ensure CORS is configured correctly

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Build APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build APK
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: npm run build:apk:release
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: turbo-cpp-mobile.apk
          path: builds/turbo-cpp-mobile.apk
```

---

## Security Best Practices

1. **Never commit keystore files** to version control
2. **Use environment variables** for passwords in CI/CD
3. **Enable ProGuard** for release builds (obfuscation)
4. **Implement certificate pinning** for API calls
5. **Use HTTPS only** for APK downloads
6. **Verify APK signature** before updates

---

## Support

For issues or questions:
- GitHub: [Project Repository]
- Developer: Suarez J. (XenozExe)
- Team: ENCRYPTED CREW

---

**Credits:** ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
