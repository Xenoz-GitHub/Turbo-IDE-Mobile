# Android APK Security Guide

## Table of Contents
1. [Keystore Generation & Management](#keystore-generation--management)
2. [Certificate Fingerprints](#certificate-fingerprints)
3. [Digital Asset Links](#digital-asset-links)
4. [Signing Configuration](#signing-configuration)
5. [ProGuard & Obfuscation](#proguard--obfuscation)
6. [Security Best Practices](#security-best-practices)
7. [Vulnerability Scanning](#vulnerability-scanning)

---

## Keystore Generation & Management

### Generate Release Keystore

```bash
keytool -genkey -v \
  -keystore release-key.keystore \
  -alias turbo-cpp-release \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -storepass [YOUR_STRONG_PASSWORD] \
  -keypass [YOUR_STRONG_PASSWORD]
```

### Keystore Information

You'll be prompted for:
- **Name**: Your name or organization
- **Organizational Unit**: Development Team
- **Organization**: ENCRYPTED CREW
- **City**: Your city
- **State**: Your state
- **Country Code**: Your 2-letter country code (e.g., US)

### Security Requirements

✅ **Password Strength:**
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Not related to app name or personal info
- Use a password manager

✅ **Storage Security:**
- Store keystore in encrypted cloud storage (Google Drive with encryption, 1Password, etc.)
- Keep backup in multiple secure locations
- NEVER commit to version control
- Add to `.gitignore`: `*.keystore`, `*.jks`

⚠️ **Critical Warning:**
If you lose your keystore, you CANNOT update your app on Google Play Store!

---

## Certificate Fingerprints

### Get SHA256 Fingerprint

#### For Release Key:
```bash
keytool -list -v \
  -keystore release-key.keystore \
  -alias turbo-cpp-release \
  -storepass [YOUR_PASSWORD]
```

#### For Debug Key (Development):
```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

### Copy the SHA256 Fingerprint

Look for:
```
Certificate fingerprints:
  SHA1: XX:XX:XX:...
  SHA256: AA:BB:CC:DD:EE:FF:...  ← COPY THIS LINE
```

Format: `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99`

---

## Digital Asset Links

### Update assetlinks.json

Location: `public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.encryptedcrew.turbocpp",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
      ]
    }
  }
]
```

### Deploy to Vercel

1. Place file in `public/.well-known/assetlinks.json`
2. Commit and push to GitHub
3. Vercel will auto-deploy
4. Verify at: `https://turbo-ide.vercel.app/.well-known/assetlinks.json`

### Verification

```bash
# Test with curl
curl https://turbo-ide.vercel.app/.well-known/assetlinks.json

# Should return valid JSON with your SHA256 fingerprint
```

---

## Signing Configuration

### Configure Android Studio

1. Create `keystore.properties` in project root:

```properties
storePassword=[YOUR_STORE_PASSWORD]
keyPassword=[YOUR_KEY_PASSWORD]
keyAlias=turbo-cpp-release
storeFile=../release-key.keystore
```

2. Add to `.gitignore`:
```
keystore.properties
*.keystore
*.jks
```

3. Update `app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()

if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## ProGuard & Obfuscation

### ProGuard Rules (`app/proguard-rules.pro`)

```proguard
# Security: Obfuscation
-repackageclasses
-allowaccessmodification
-renamesourcefileattribute SourceFile

# Security: Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
}

# Keep AndroidBrowserHelper
-keep class androidx.browser.** { *; }
-keep class com.google.androidbrowserhelper.** { *; }

# Security: String encryption (optional)
-adaptclassstrings
```

### Verify Obfuscation

After building release APK:

```bash
# Extract APK
unzip app-release.apk -d extracted/

# Check obfuscation
jadx extracted/classes.dex

# Should see obfuscated class names like: a.b.c.d
```

---

## Security Best Practices

### 1. Build Configuration Security

✅ **Release Build:**
```gradle
release {
    debuggable false
    jniDebuggable false
    renderscriptDebuggable false
    minifyEnabled true
    shrinkResources true
}
```

⚠️ **Never:**
- Set `debuggable true` in release
- Hardcode API keys in code
- Include development endpoints in release

### 2. Manifest Security

✅ **AndroidManifest.xml:**
```xml
<application
    android:allowBackup="false"
    android:usesCleartextTraffic="false"
    android:hardwareAccelerated="true">
```

### 3. Network Security

✅ **Only HTTPS:**
- All API endpoints must use HTTPS
- Certificate pinning recommended for sensitive apps
- No `android:usesCleartextTraffic="true"`

### 4. Permissions

✅ **Minimal Permissions:**
```xml
<!-- Only request what's needed -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

⚠️ **Avoid:**
- `READ_PHONE_STATE`
- `ACCESS_FINE_LOCATION`
- `CAMERA` (unless actually needed)

### 5. Code Security

✅ **Do:**
- Validate all inputs
- Use parameterized queries
- Sanitize user data
- Implement rate limiting
- Log security events

⚠️ **Don't:**
- Store secrets in SharedPreferences
- Use weak encryption
- Trust client-side validation only
- Expose internal APIs

---

## Vulnerability Scanning

### 1. Dependency Check

```bash
# Check for vulnerable dependencies
./gradlew dependencyUpdates

# Security audit
npm audit
```

### 2. Static Analysis

```bash
# Lint checks
./gradlew lint

# Android Lint security checks
./gradlew lintRelease
```

### 3. APK Analyzer

In Android Studio:
1. Build → Analyze APK
2. Check for:
   - Unintended files in APK
   - Large resources
   - Obfuscation effectiveness

### 4. Play Console Security Scan

Google Play automatically scans APKs for:
- Known vulnerabilities
- Malware
- Policy violations

Address all security warnings before publishing.

---

## Google Play Store Checklist

Before publishing:

- [ ] Release keystore generated and backed up
- [ ] SHA256 fingerprint added to assetlinks.json
- [ ] assetlinks.json deployed and accessible
- [ ] ProGuard enabled and tested
- [ ] Code obfuscation verified
- [ ] Debug logging removed from release
- [ ] API keys stored securely (not in code)
- [ ] All HTTPS connections validated
- [ ] Permissions minimized
- [ ] App signed with release key
- [ ] Version code incremented
- [ ] Tested on multiple devices
- [ ] Security scan passed
- [ ] Privacy policy URL added
- [ ] Data safety form completed

---

## Emergency Procedures

### Lost Keystore

**Prevention:**
- Backup to encrypted cloud storage NOW
- Store password in password manager
- Document keystore location

**If Lost:**
- Cannot update existing app on Play Store
- Must publish as new app with new package name
- Notify users to install new version
- Keep old app published with notice

### Compromised Key

1. **Immediate:**
   - Generate new keystore
   - Update assetlinks.json with new fingerprint
   - Build and sign with new key

2. **Google Play:**
   - Contact Google Play support
   - Request app signing key rotation (if using Play App Signing)

3. **Users:**
   - Push emergency update
   - Display in-app notification
   - Update documentation

---

## Resources

### Official Documentation
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Android Security Best Practices](https://developer.android.com/topic/security/best-practices)
- [ProGuard Manual](https://www.guardsquare.com/manual/home)

### Security Tools
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [MobSF - Mobile Security Framework](https://github.com/MobSF/Mobile-Security-Framework-MobSF)
- [jadx - DEX to Java decompiler](https://github.com/skylot/jadx)

### Verification Tools
- [Google Asset Links Testing Tool](https://developers.google.com/digital-asset-links/tools/generator)
- [APK Analyzer](https://developer.android.com/studio/build/apk-analyzer)

---

## Support

For security issues or questions:
- GitHub Issues: Report security vulnerabilities privately
- Email: security@encryptedcrew.com (if available)
- Documentation: Check official Android security guides

---

**Created by ENCRYPTED CREW**
**Last Updated:** September 24, 2026

⚠️ **Security is an ongoing process. Regularly update dependencies, scan for vulnerabilities, and follow Android security best practices.**
