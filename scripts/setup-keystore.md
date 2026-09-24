# Android Keystore Setup Guide

## Generate Release Keystore for Signing APK

To create a production-ready signed APK, you need to generate a keystore file:

```bash
keytool -genkey -v -keystore release-key.keystore -alias turbo-cpp-key -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- **Keystore password**: Choose a strong password (store it securely!)
- **Key password**: Can be the same as keystore password
- **Distinguished Name fields**: 
  - First and last name: Your name or organization
  - Organizational unit: Development Team
  - Organization: ENCRYPTED CREW
  - City/Locality: Your city
  - State/Province: Your state
  - Country code: Two-letter country code (e.g., US)

## Configure Keystore in Gradle

After generating the keystore, create `android/keystore.properties`:

```properties
storeFile=../release-key.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=turbo-cpp-key
keyPassword=YOUR_KEY_PASSWORD
```

⚠️ **IMPORTANT**: Never commit `keystore.properties` or your keystore file to version control!

Add to `.gitignore`:
```
release-key.keystore
android/keystore.properties
```

## Environment Variables (CI/CD)

For automated builds, use environment variables:

```bash
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_PASSWORD="your_key_password"
```

## Get SHA-256 Fingerprint for Digital Asset Links

For Android App Links and TWA support:

```bash
keytool -list -v -keystore release-key.keystore -alias turbo-cpp-key
```

Copy the SHA-256 fingerprint and add it to `.well-known/assetlinks.json`.

## Build Commands

**Debug APK** (for testing):
```bash
npm run build:apk:debug
```

**Release APK** (signed with keystore):
```bash
npm run build:apk:release
```

**Full automated build**:
```bash
npm run build:apk
```

## Install on Device

### Using ADB:
```bash
adb install builds/turbo-cpp-mobile.apk
```

### Manual Installation:
1. Transfer APK to your Android device
2. Go to Settings > Security > Enable "Install from Unknown Sources"
3. Open the APK file using a file manager
4. Tap "Install"

## App Bundle for Google Play

To create an App Bundle (.aab) for Play Store:

```bash
cd android
./gradlew bundleRelease
```

The bundle will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Vercel/Server Deployment

After building, copy the APK to your server's `builds/` directory:

```bash
mkdir -p builds
cp builds/turbo-cpp-mobile.apk builds/
```

The Express server at `/api/download/apk` will serve this file.
