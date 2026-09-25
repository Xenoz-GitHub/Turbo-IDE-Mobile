/**
 * Vercel Serverless Function: TWA Package Generator
 * Generates a complete Android Studio TWA project as a ZIP file
 * 
 * Security Features:
 * - Input validation and sanitization
 * - Rate limiting via Vercel's built-in protection
 * - Size limits to prevent ZIP bombs
 * - XSS and injection prevention
 * 
 * ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import JSZip from 'jszip';

// Security: Input sanitization
function sanitizeInput(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim().substring(0, maxLength);
  sanitized = sanitized.replace(/[<>"'`]/g, '');
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

// Security: URL validation
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = ['127.0.0.1', '0.0.0.0', '169.254.169.254'];
    const isLocalhost = url.startsWith('http://localhost');
    
    if (!isLocalhost && blockedHosts.some(blocked => hostname.includes(blocked))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Security: Package name validation
function isValidPackageName(packageName: string): boolean {
  const pattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  return pattern.test(packageName);
}

// Security: Hex color validation
function isValidHexColor(color: string): boolean {
  const pattern = /^#[0-9A-Fa-f]{6}$/;
  return pattern.test(color);
}

// Security: File name sanitization for ZIP
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      appName,
      packageName,
      hostUrl,
      themeColor = '#0000AA',
      backgroundColor = '#0000AA',
    } = req.body;

    // Validate required fields
    if (!appName || !packageName || !hostUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: appName, packageName, hostUrl' 
      });
    }

    // Security: Validate inputs
    if (!isValidPackageName(packageName)) {
      return res.status(400).json({ 
        error: 'Invalid package name format. Use format: com.company.app' 
      });
    }

    if (!isValidUrl(hostUrl)) {
      return res.status(400).json({ 
        error: 'Invalid or insecure URL' 
      });
    }

    if (!isValidHexColor(themeColor) || !isValidHexColor(backgroundColor)) {
      return res.status(400).json({ 
        error: 'Invalid color format. Use hex colors like #0000AA' 
      });
    }

    // Sanitize inputs
    const sanitizedAppName = sanitizeInput(appName, 100);
    const sanitizedPackageName = sanitizeInput(packageName, 255);
    const sanitizedHostUrl = hostUrl.trim();

    if (!sanitizedAppName || !sanitizedPackageName || !sanitizedHostUrl) {
      return res.status(400).json({ error: 'Invalid input after sanitization' });
    }

    // Extract hostname
    let hostname: string;
    try {
      hostname = new URL(sanitizedHostUrl).hostname;
    } catch {
      return res.status(400).json({ error: 'Invalid host URL' });
    }

    // Security: ZIP size limit
    const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB

    // Create ZIP package
    const zip = new JSZip();

    // Root README.md
    zip.file('README.md', `# ${sanitizedAppName} - Android TWA Project

## Quick Start Guide

This is a complete Android Studio project for building a Trusted Web Activity (TWA) APK.

### Prerequisites
- Android Studio (latest version)
- Java JDK 17 or higher
- Android SDK (API 34 or higher)

### Build Steps

1. **Open Project**
   - Launch Android Studio
   - Select "Open an Existing Project"
   - Navigate to this extracted folder

2. **Sync Project**
   - Android Studio will automatically sync Gradle
   - Wait for dependencies to download

3. **Build APK**
   - Go to Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or Build → Generate Signed Bundle / APK for Play Store

4. **Output Location**
   - Debug APK: \`app/build/outputs/apk/debug/app-debug.apk\`
   - Release APK: \`app/build/outputs/apk/release/app-release.apk\`

### Digital Asset Links Verification

The included \`.well-known/assetlinks.json\` must be hosted at:
\`${sanitizedHostUrl}/.well-known/assetlinks.json\`

This file verifies your app's ownership of the domain.

### Important: APK launches directly to IDE

The TWA is configured to launch directly to the IDE screen at:
\`${sanitizedHostUrl}/#ide\`

This bypasses the landing page and opens the full Turbo C++ IDE immediately.

### Security Notes

1. **Certificate Fingerprints**: Update SHA256 fingerprints in assetlinks.json with your signing key
2. **Signing Keys**: Never commit keystore files to version control
3. **Release Builds**: ProGuard is enabled for release builds
4. **HTTPS Only**: Ensure your domain uses HTTPS

### Play Store Publishing

1. Generate a signed release build
2. Create a Google Play Console account
3. Upload the AAB (Android App Bundle) file
4. Complete store listing
5. Submit for review

**ENCRYPTED CREW © ${new Date().getFullYear()}**
`);

    // build.gradle (Project level)
    zip.file('build.gradle', `// Top-level build file
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`);

    // settings.gradle
    zip.file('settings.gradle', `include ':app'
rootProject.name = "${sanitizedAppName}"
`);

    // gradle.properties
    zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=false
`);

    // local.properties
    zip.file('local.properties', `# This file is automatically generated by Android Studio.
# Do not modify this file -- YOUR CHANGES WILL BE ERASED!
# Location of the SDK. This is only used by Gradle.
# sdk.dir=/path/to/your/Android/sdk
`);

    // app/build.gradle
    zip.file('app/build.gradle', `plugins {
    id 'com.android.application'
}

android {
    namespace '${sanitizedPackageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${sanitizedPackageName}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            debuggable false
            jniDebuggable false
            renderscriptDebuggable false
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    packagingOptions {
        resources {
            excludes += ['/META-INF/{AL2.0,LGPL2.1}']
        }
    }
    
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.browser:browser:1.7.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
`);

    // app/proguard-rules.pro
    zip.file('app/proguard-rules.pro', `# ProGuard rules for ${sanitizedAppName}

# Keep AndroidBrowserHelper classes
-keep class androidx.browser.** { *; }
-keep class com.google.androidbrowserhelper.** { *; }
-dontwarn androidx.browser.**
-dontwarn com.google.androidbrowserhelper.**

# Security: Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Security: Obfuscate class names
-repackageclasses
-allowaccessmodification

# Security: Remove source file names
-renamesourcefileattribute SourceFile
`);

    // AndroidManifest.xml
    zip.file('app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TurboCpp"
        android:usesCleartextTraffic="false"
        tools:targetApi="31">

        <meta-data
            android:name="asset_statements"
            android:resource="@string/asset_statements" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/Theme.LauncherActivity">

            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="${sanitizedHostUrl}/#ide" />

            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary" />

            <meta-data
                android:name="android.support.customtabs.trusted.NAVIGATION_BAR_COLOR"
                android:resource="@color/colorPrimary" />

            <meta-data
                android:name="android.support.customtabs.trusted.SPLASH_IMAGE_DRAWABLE"
                android:resource="@drawable/splash" />

            <meta-data
                android:name="android.support.customtabs.trusted.SPLASH_SCREEN_BACKGROUND_COLOR"
                android:resource="@color/colorPrimary" />

            <meta-data
                android:name="android.support.customtabs.trusted.SPLASH_SCREEN_FADE_OUT_DURATION"
                android:value="300" />

            <meta-data
                android:name="android.support.customtabs.trusted.FILE_PROVIDER_AUTHORITY"
                android:value="${sanitizedPackageName}.fileprovider" />

            <meta-data
                android:name="android.support.customtabs.trusted.FALLBACK_STRATEGY"
                android:value="webview" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="${hostname}" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${sanitizedPackageName}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
`);

    // strings.xml
    const escapedAppName = sanitizedAppName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    zip.file('app/src/main/res/values/strings.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${escapedAppName}</string>
    <string name="asset_statements">
        [{
            "relation": ["delegate_permission/common.handle_all_urls"],
            "target": {
                "namespace": "web",
                "site": "${sanitizedHostUrl}"
            }
        }]
    </string>
</resources>
`);

    // colors.xml
    zip.file('app/src/main/res/values/colors.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${themeColor}</color>
    <color name="colorPrimaryDark">#000088</color>
    <color name="colorAccent">#55AAFF</color>
    <color name="colorBackground">${backgroundColor}</color>
</resources>
`);

    // themes.xml
    zip.file('app/src/main/res/values/themes.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.TurboCpp" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:windowBackground">@color/colorBackground</item>
        <item name="android:statusBarColor">@color/colorPrimary</item>
        <item name="android:navigationBarColor">@color/colorPrimary</item>
    </style>

    <style name="Theme.LauncherActivity" parent="Theme.TurboCpp">
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
`);

    // splash.xml drawable
    zip.file('app/src/main/res/drawable/splash.xml', `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/colorPrimary"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher"/>
    </item>
</layer-list>
`);

    // file_paths.xml
    zip.file('app/src/main/res/xml/file_paths.xml', `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="external_files" path="."/>
</paths>
`);

    // Digital Asset Links - assetlinks.json
    const assetLinksContent = JSON.stringify([
      {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
          "namespace": "android_app",
          "package_name": sanitizedPackageName,
          "sha256_cert_fingerprints": [
            "REPLACE_WITH_YOUR_ACTUAL_SHA256_FINGERPRINT"
          ]
        }
      }
    ], null, 2);

    zip.file('.well-known/assetlinks.json', assetLinksContent);

    // Security setup guide
    zip.file('SECURITY_SETUP.md', `# Security Setup Guide

## Digital Asset Links Certificate Fingerprints

### IMPORTANT: You MUST update the SHA256 fingerprints!

The file \`.well-known/assetlinks.json\` contains a placeholder fingerprint.
You need to replace it with your actual signing key fingerprint.

### How to get your SHA256 fingerprint:

#### For Debug Builds:
\`\`\`bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
\`\`\`

#### For Release Builds:
\`\`\`bash
keytool -list -v -keystore /path/to/your/release.keystore -alias your_alias_name
\`\`\`

Look for the "SHA256:" line and copy the fingerprint (colon-separated format).

### Update the assetlinks.json file:

1. Get your SHA256 fingerprint from above
2. Edit \`.well-known/assetlinks.json\`
3. Replace \`REPLACE_WITH_YOUR_ACTUAL_SHA256_FINGERPRINT\` with your actual fingerprint
4. Deploy this file to: \`${sanitizedHostUrl}/.well-known/assetlinks.json\`

### Vercel Deployment:

If using Vercel, place assetlinks.json in your \`public/.well-known/\` folder before deployment.

### Verification:

After deployment, verify the link works:
\`\`\`
${sanitizedHostUrl}/.well-known/assetlinks.json
\`\`\`

## Keystore Security Best Practices

1. **Never commit keystores to version control**
2. **Use strong passwords** (minimum 12 characters)
3. **Backup your keystore securely**
4. **Generate separate keys for debug/release**

### Generate a new release keystore:

\`\`\`bash
keytool -genkey -v -keystore release-key.keystore -alias release-alias -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

## Security Checklist

- [ ] Updated SHA256 fingerprint in assetlinks.json
- [ ] Deployed assetlinks.json to ${sanitizedHostUrl}/.well-known/
- [ ] Verified assetlinks.json is publicly accessible
- [ ] Keystore backed up securely
- [ ] ProGuard enabled for release builds
- [ ] HTTPS certificate valid on domain

**ENCRYPTED CREW - Security First**
`);

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Security: Check ZIP size
    if (zipBuffer.length > MAX_ZIP_SIZE) {
      return res.status(413).json({ 
        error: 'Generated package exceeds maximum size limit' 
      });
    }

    // Log successful generation
    console.log(`[TWA] Generated package for: ${sanitizedAppName} (${zipBuffer.length} bytes)`);

    // Set response headers
    const safeFilename = sanitizeFilename(`${sanitizedPackageName}-twa.zip`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    // Send ZIP file
    return res.status(200).send(zipBuffer);

  } catch (error) {
    console.error('[TWA ERROR]', error);
    return res.status(500).json({ 
      error: 'Internal server error while generating TWA package' 
    });
  }
}
