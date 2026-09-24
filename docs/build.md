# Build & Compilation Guide

**Credits: ENCRYPTED CREW**

---

## 1. Prerequisites
- **CMake:** 3.22.1+
- **Android NDK:** r25c or newer
- **Android Studio / Gradle:** Gradle 8.4+, JDK 17
- **macOS / Xcode:** Xcode 15+, iOS 15.0+ SDK

---

## 2. Android Build (APK & AAB)
\`\`\`bash
# 1. Build C++ Native Core for all ABIs (arm64-v8a, armeabi-v7a, x86_64)
./tools/build_core.sh

# 2. Build Android App Bundle (Release AAB for Google Play)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
\`\`\`

---

## 3. iOS Build (IPA)
\`\`\`bash
# 1. Generate Xcode project & compile static core library
cd ios
xcodebuild -project TurboCMobile.xcodeproj -scheme TurboCMobile -configuration Release -destination 'generic/platform=iOS' archive -archivePath build/TurboCMobile.xcarchive

# 2. Export IPA
xcodebuild -exportArchive -archivePath build/TurboCMobile.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/ipa
\`\`\`
