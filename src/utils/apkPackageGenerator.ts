/**
 * PWABuilder & Android TWA (Trusted Web Activity) Package Generator
 * Generates ready-to-build Android Studio project and PWABuilder configuration
 * for Turbo C++ Mobile (ENCRYPTED CREW).
 */

import JSZip from 'jszip';

export interface ApkPackageOptions {
  siteUrl: string;
  appName?: string;
  shortName?: string;
  packageName?: string;
  versionCode?: number;
  versionName?: string;
}

export async function generateAndroidTwaPackage(options: ApkPackageOptions): Promise<Blob> {
  const siteUrl = options.siteUrl.replace(/\/$/, '');
  const urlObj = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
  const host = urlObj.host;
  const appName = options.appName || 'Turbo C++ Mobile';
  const packageName = options.packageName || 'com.encryptedcrew.turbocpp';
  const versionCode = options.versionCode || 1;
  const versionName = options.versionName || '1.0.0';

  const zip = new JSZip();

  // Root build.gradle
  zip.file(
    'build.gradle',
    `// Top-level build file where you can add configuration options common to all sub-projects/modules.
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
`
  );

  // settings.gradle
  zip.file(
    'settings.gradle',
    `include ':app'
rootProject.name = "TurboCppMobile"
`
  );

  // app/build.gradle
  zip.file(
    'app/build.gradle',
    `plugins {
    id 'com.android.application'
}

android {
    namespace '${packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${packageName}"
        minSdk 21
        targetSdk 34
        versionCode ${versionCode}
        versionName "${versionName}"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        manifestPlaceholders = [
            hostName: "${host}",
            defaultUrl: "${siteUrl}/",
            launcherName: "${appName}",
            assetStatements: '[{ \\"relation\\": [\\"delegate_permission/common.handle_all_urls\\"], \\"target\\": {\\"namespace\\": \\"android_app\\", \\"package_name\\": \\"${packageName}\\", \\"sha256_cert_fingerprints\\": [\\"YOUR_SHA256_FINGERPRINT_HERE\\"]}}]'
        ]
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
`
  );

  // app/src/main/AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="\${launcherName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TurboCpp">

        <meta-data
            android:name="asset_statements"
            android:value="\${assetStatements}" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true"
            android:label="\${launcherName}">

            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="\${defaultUrl}" />

            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary" />

            <meta-data
                android:name="android.support.customtabs.trusted.NAVIGATION_BAR_COLOR"
                android:resource="@color/colorPrimaryDark" />

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
                    android:host="\${hostName}" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
  );

  // app/src/main/res/values/colors.xml
  zip.file(
    'app/src/main/res/values/colors.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#0000AA</color>
    <color name="colorPrimaryDark">#000088</color>
    <color name="colorAccent">#00AAAA</color>
    <color name="backgroundColor">#0000AA</color>
</resources>
`
  );

  // app/src/main/res/values/styles.xml
  zip.file(
    'app/src/main/res/values/styles.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.TurboCpp" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:windowBackground">@color/backgroundColor</item>
    </style>
</resources>
`
  );

  // assetlinks.json
  zip.file(
    '.well-known/assetlinks.json',
    `[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "${packageName}",
      "sha256_cert_fingerprints": [
        "PASTE_YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
`
  );

  // pwabuilder-options.json
  zip.file(
    'pwabuilder-options.json',
    JSON.stringify(
      {
        packageId: packageName,
        name: appName,
        launcherName: 'Turbo C++',
        version: versionName,
        versionCode: versionCode,
        webAppUrl: `${siteUrl}/`,
        startUrl: '/?source=pwa',
        themeColor: '#0000AA',
        navigationColor: '#000088',
        backgroundColor: '#0000AA',
        display: 'standalone',
        orientation: 'any',
        signingMode: 'none',
      },
      null,
      2
    )
  );

  // README.md with detailed instructions
  zip.file(
    'README.md',
    `# Turbo C++ Mobile - Android APK & PWABuilder TWA Package
ENCRYPTED CREW - Developed by Suarez J. (XenozExe)

This package contains the complete Android Trusted Web Activity (TWA) project for Turbo C++ Mobile, ready for compiling directly into an Android APK or submitting to the Google Play Store via PWABuilder.

---

### Option 1: Fast Build with PWABuilder (Recommended)
1. Go to https://www.pwabuilder.com
2. Enter your live site URL: ${siteUrl}
3. Click "Package for Stores" -> "Android"
4. Upload the \`pwabuilder-options.json\` or customize package name: \`${packageName}\`
5. Download your signed APK and Google Play Store App Bundle (.aab).

---

### Option 2: Build Locally with Android Studio
1. Open Android Studio (version Iguana or newer).
2. Select "Open an Existing Project" and choose this unzipped folder.
3. Wait for Gradle sync to complete.
4. Select Build -> Build Bundle(s) / APK(s) -> Build APK(s).
5. Your signed or debug APK will be generated at:
   \`app/build/outputs/apk/debug/app-debug.apk\`

---

### Digital Asset Links (.well-known/assetlinks.json)
To remove the URL bar completely in Android:
1. Place \`.well-known/assetlinks.json\` in your public directory (\`/public/.well-known/assetlinks.json\`).
2. Replace \`PASTE_YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT_HERE\` with your app's signing key fingerprint.

---
Credits: ENCRYPTED CREW
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
