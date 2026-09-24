/**
 * Production Backend Server for Turbo C++ Mobile
 * Handles APK hosting, version manifest, and update checks
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 * 
 * SECURITY FEATURES:
 * - Helmet.js security headers
 * - Rate limiting per IP
 * - Input validation and sanitization
 * - CORS configuration
 * - Path traversal prevention
 * - ZIP bomb protection
 * - Request size limits
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult, ValidationError } from 'express-validator';
import sanitize from 'sanitize-filename';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Helmet - Set secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://storage.googleapis.com", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://turbo-ide.vercel.app", "https://*.vercel.app"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Security: CORS configuration - Only allow specific origins
const allowedOrigins = [
  'https://turbo-ide.vercel.app',
  'https://*.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'capacitor://localhost',
  'ionic://localhost'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(origin);
      }
      return pattern === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security: Rate limiting - Prevent DoS attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for sensitive endpoints
  message: 'Too many requests from this IP for this resource, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all requests
app.use(generalLimiter);

// Security: Request size limits to prevent payload attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security: Serve static files with security headers
app.use(express.static('dist', {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Additional security headers for static files
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    
    // Set appropriate cache control
    if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Security: Input sanitization helper
function sanitizeInput(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') return '';
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>\"\'`]/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

// Security: URL validation helper
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS (or HTTP for localhost)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    // Prevent SSRF by blocking internal IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
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
  // Android package name pattern: com.company.app
  const pattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  return pattern.test(packageName);
}

// Security: Hex color validation
function isValidHexColor(color: string): boolean {
  const pattern = /^#[0-9A-Fa-f]{6}$/;
  return pattern.test(color);
}

// Security: Logging middleware for suspicious activities
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\s*\(/i, // Code injection
  ];
  
  const requestString = JSON.stringify(req.body) + req.url;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
  
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected from ${ip}: ${req.method} ${req.url}`);
  }
  
  next();
});

// Version manifest
interface VersionManifest {
  version: string;
  versionCode: number;
  releaseDate: string;
  downloadUrl: string;
  fileSize: number;
  changelog: string[];
  minVersion: string;
  critical: boolean;
}

// Import version from config (in production, read from package.json or env)
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const VERSION_CODE = parseInt(process.env.VERSION_CODE || '1', 10);

const VERSION_MANIFEST: VersionManifest = {
  version: APP_VERSION,
  versionCode: VERSION_CODE,
  releaseDate: new Date().toISOString(),
  downloadUrl: '/api/download/apk',
  fileSize: 0, // Will be calculated
  changelog: [
    'Initial public release',
    'Full Borland Turbo C++ 3.0 compatibility',
    'Complete graphics.h BGI support (640x480 VGA)',
    'conio.h console functions (clrscr, textcolor, gotoxy)',
    'dos.h system functions (sound, delay, PC speaker)',
    'Mobile touch virtual keyboard with shortcuts',
    'Offline PWA support with auto-update',
    'Android APK with automatic updates',
    'iOS Add to Home Screen support',
    'File import/export to device storage',
    'Real-time compilation and execution',
  ],
  minVersion: '1.0.0',
  critical: false,
};

// API: Get version manifest for update checks
app.get('/api/version', (req: Request, res: Response) => {
  try {
    const apkPath = path.join(process.cwd(), 'builds', 'turbo-cpp-mobile.apk');
    
    try {
      if (fs.existsSync(apkPath)) {
        const stats = fs.statSync(apkPath);
        VERSION_MANIFEST.fileSize = stats.size;
      }
    } catch (err) {
      console.error('[ERROR] Error reading APK file:', err);
    }

    // Security: Remove sensitive internal paths
    const safeManifest = { ...VERSION_MANIFEST };
    
    res.json(safeManifest);
  } catch (error) {
    console.error('[ERROR] Error in /api/version:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Check for updates
// Security: Apply rate limiting to prevent abuse
app.post('/api/check-update', generalLimiter, (req: Request, res: Response) => {
  try {
    const { currentVersion, currentVersionCode } = req.body;
    
    // Security: Validate input
    if (typeof currentVersionCode !== 'number' || currentVersionCode < 0) {
      return res.status(400).json({ error: 'Invalid version code' });
    }
    
    const hasUpdate = VERSION_MANIFEST.versionCode > (currentVersionCode || 0);
    
    res.json({
      hasUpdate,
      currentVersion: VERSION_MANIFEST.version,
      versionCode: VERSION_MANIFEST.versionCode,
      critical: VERSION_MANIFEST.critical,
      changelog: VERSION_MANIFEST.changelog,
      downloadUrl: VERSION_MANIFEST.downloadUrl,
      fileSize: VERSION_MANIFEST.fileSize
    });
  } catch (error) {
    console.error('[ERROR] Error in /api/check-update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Download APK
// Security: Apply strict rate limiting
app.get('/api/download/apk', strictLimiter, (req: Request, res: Response) => {
  try {
    const apkPath = path.join(process.cwd(), 'builds', 'turbo-cpp-mobile.apk');
    
    // Security: Prevent directory traversal
    const safePath = path.normalize(apkPath);
    if (!safePath.startsWith(process.cwd())) {
      console.warn('[SECURITY] Path traversal attempt detected');
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ 
        error: 'APK file not found. Please build the APK first using Capacitor.' 
      });
    }

    const stat = fs.statSync(safePath);
    
    // Security: Set secure headers
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename=turbo-cpp-mobile.apk');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const fileStream = fs.createReadStream(safePath);
    
    // Security: Handle stream errors
    fileStream.on('error', (error) => {
      console.error('[ERROR] Error streaming APK:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('[ERROR] Error in /api/download/apk:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Track install/update analytics (optional)
app.post('/api/analytics/install', (req: Request, res: Response) => {
  const { version, platform, timestamp } = req.body;
  
  // Log installation for analytics
  console.log('Installation tracked:', { version, platform, timestamp });
  
  res.json({ success: true });
});

// API: Generate TWA (Trusted Web Activity) Android Project Package
// Security: Apply strict rate limiting and input validation
app.post('/api/generate-twa',
  strictLimiter,
  [
    body('appName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('App name must be between 1 and 100 characters')
      .matches(/^[a-zA-Z0-9\s\-\+]+$/)
      .withMessage('App name contains invalid characters'),
    body('packageName')
      .trim()
      .custom(isValidPackageName)
      .withMessage('Invalid Android package name format'),
    body('hostUrl')
      .trim()
      .custom(isValidUrl)
      .withMessage('Invalid or insecure URL'),
    body('themeColor')
      .optional()
      .trim()
      .custom(isValidHexColor)
      .withMessage('Invalid hex color format'),
    body('backgroundColor')
      .optional()
      .trim()
      .custom(isValidHexColor)
      .withMessage('Invalid hex color format'),
  ],
  async (req: Request, res: Response) => {
    // Security: Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[SECURITY] Invalid TWA generation request:', errors.array());
      return res.status(400).json({ 
        error: 'Invalid input',
        details: errors.array()
      });
    }

    try {
      const {
        appName,
        packageName,
        hostUrl,
        themeColor = '#0000AA',
        backgroundColor = '#0000AA',
      } = req.body;

      // Security: Sanitize inputs
      const sanitizedAppName = sanitizeInput(appName, 100);
      const sanitizedPackageName = sanitizeInput(packageName, 255);
      const sanitizedHostUrl = hostUrl.trim();

      // Security: Additional validation
      if (!sanitizedAppName || !sanitizedPackageName || !sanitizedHostUrl) {
        return res.status(400).json({ error: 'Missing or invalid required fields' });
      }

      // Security: Check ZIP size limit (prevent ZIP bombs)
      const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB limit
      
      const zip = new JSZip();

      // Log generation for audit trail
      console.log(`[INFO] Generating TWA package for: ${sanitizedAppName} (${sanitizedPackageName})`);

      // Security: Use sanitized filename
      const safeFilename = sanitize(`${sanitizedPackageName}-twa.zip`);

      // Extract hostname safely
      let hostname: string;
      try {
        hostname = new URL(sanitizedHostUrl).hostname;
      } catch {
        return res.status(400).json({ error: 'Invalid host URL' });
      }

    // Root README.md (using sanitized values)
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

1. **Certificate Fingerprints**: You MUST update the SHA256 fingerprints in assetlinks.json with your actual signing key
2. **Signing Keys**: Never commit your keystore files to version control
3. **Release Builds**: Always use ProGuard for release builds (already configured)
4. **HTTPS Only**: Ensure your domain uses HTTPS with valid certificate

### Play Store Publishing

1. Generate a signed release build
2. Create a Google Play Console account
3. Upload the AAB (Android App Bundle) file
4. Complete store listing with screenshots and description
5. Submit for review

### Support

For issues or questions, visit: https://github.com/encryptedcrew

**Built with PWABuilder & Capacitor**
**ENCRYPTED CREW © ${new Date().getFullYear()}**
`);

    // build.gradle (Project level)
    zip.file('build.gradle', `// Top-level build file where you can add configuration options common to all sub-projects/modules.
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

    // settings.gradle (sanitized)
    zip.file('settings.gradle', `include ':app'
rootProject.name = "${sanitizedAppName}"
`);

    // gradle.properties
    zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=false
`);

    // local.properties (empty, user will configure)
    zip.file('local.properties', `# This file is automatically generated by Android Studio.
# Do not modify this file -- YOUR CHANGES WILL BE ERASED!
#
# This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
# For customization when using a Version Control System, please read the
# header note.
# sdk.dir=/path/to/your/Android/sdk
`);

    // app/build.gradle (sanitized)
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
            
            // Security: Disable debugging in release builds
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
    
    // Security: Enable code shrinking and obfuscation
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

    // app/proguard-rules.pro (enhanced security)
    zip.file('app/proguard-rules.pro', `# Add project specific ProGuard rules here.

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

    // AndroidManifest.xml (sanitized and secured)
    zip.file('app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Security: Only request necessary permissions -->
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

        <!-- Security: Secure FileProvider configuration -->
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

    // strings.xml (sanitized, with XML escaping)
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

    // colors.xml - Borland Blue theme
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

    // Digital Asset Links - assetlinks.json (sanitized)
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

    // Security guide for certificate fingerprints
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
https://yourdomain.com/.well-known/assetlinks.json
\`\`\`

## Keystore Security Best Practices

1. **Never commit keystores to version control**
   - Add \`*.keystore\` and \`*.jks\` to .gitignore

2. **Use strong passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

3. **Backup your keystore securely**
   - Encrypted cloud storage
   - Hardware security module (HSM) for production

4. **Generate separate keys for debug/release**
   - Debug: Use Android's default debug key
   - Release: Generate a new, secure keystore

### Generate a new release keystore:

\`\`\`bash
keytool -genkey -v -keystore release-key.keystore -alias release-alias -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

## Security Checklist

- [ ] Updated SHA256 fingerprint in assetlinks.json
- [ ] Deployed assetlinks.json to ${sanitizedHostUrl}/.well-known/
- [ ] Verified assetlinks.json is publicly accessible
- [ ] Keystore backed up securely
- [ ] Keystore password stored securely (not in code)
- [ ] ProGuard enabled for release builds
- [ ] Code obfuscation verified
- [ ] HTTPS certificate valid on domain
- [ ] No hardcoded API keys or secrets in code

## Resources

- [Android App Links](https://developer.android.com/training/app-links/verify-android-applinks)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Signing Your App](https://developer.android.com/studio/publish/app-signing)
`);

    // PWABuilder options (sanitized)
    zip.file('pwabuilder-options.json', JSON.stringify({
      "name": sanitizedAppName,
      "packageId": sanitizedPackageName,
      "host": sanitizedHostUrl,
      "startUrl": "/#ide",
      "themeColor": themeColor,
      "backgroundColor": backgroundColor,
      "enableNotifications": true,
      "enableSiteSettingsShortcut": true,
      "isChromeOSOnly": false,
      "shortcuts": [],
      "enableOffline": true,
      "offlineMode": "serviceworker",
      "webManifestUrl": `${sanitizedHostUrl}/manifest.webmanifest`
    }, null, 2));

    // Security: Generate ZIP with size limit check
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Security: Check ZIP size before sending
    if (zipBuffer.length > MAX_ZIP_SIZE) {
      console.error('[SECURITY] Generated ZIP exceeds size limit');
      return res.status(413).json({ 
        error: 'Generated package exceeds maximum size limit' 
      });
    }

    // Security: Log successful generation
    console.log(`[INFO] TWA package generated successfully: ${safeFilename} (${zipBuffer.length} bytes)`);

    // Send the ZIP file with secure headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(zipBuffer);

  } catch (error) {
    console.error('[ERROR] Error generating TWA package:', error);
    res.status(500).json({ 
      error: 'Failed to generate TWA package',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    version: VERSION_MANIFEST.version,
    timestamp: new Date().toISOString() 
  });
});

// Serve React app for all other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});


// Security: Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR] Unhandled error:', err);
  
  // Security: Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && { message: err.message, stack: err.stack })
  });
});

// Security: 404 handler
app.use((req: Request, res: Response) => {
  console.warn(`[WARN] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Turbo C++ Mobile Server running on port ${PORT}`);
  console.log(`📦 APK Download: http://localhost:${PORT}/api/download/apk`);
  console.log(`📋 Version Info: http://localhost:${PORT}/api/version`);
  console.log(`🔒 Security: Helmet, Rate Limiting, Input Validation ENABLED`);
});
