/**
 * Build Script for Android APK Generation
 * Automates the process of building signed APK for Turbo C++ Mobile
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'builds');
const ANDROID_DIR = path.join(__dirname, '..', 'android');

console.log('🚀 Starting Turbo C++ Mobile APK Build Process...\n');

// Step 1: Clean previous builds
console.log('📦 Step 1: Cleaning previous builds...');
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });
console.log('✅ Build directory cleaned\n');

// Step 2: Build React application
console.log('⚛️  Step 2: Building React application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ React build completed\n');
} catch (error) {
  console.error('❌ React build failed');
  process.exit(1);
}

// Step 3: Sync Capacitor
console.log('🔄 Step 3: Syncing Capacitor...');
try {
  execSync('npx cap sync android', { stdio: 'inherit' });
  console.log('✅ Capacitor sync completed\n');
} catch (error) {
  console.error('❌ Capacitor sync failed');
  process.exit(1);
}

// Step 4: Build Android APK
console.log('🤖 Step 4: Building Android APK...');
console.log('This may take several minutes...\n');

try {
  // Change to android directory
  process.chdir(ANDROID_DIR);
  
  // Build debug APK (for testing)
  console.log('Building DEBUG APK...');
  execSync('./gradlew assembleDebug', { stdio: 'inherit' });
  
  // Copy debug APK to builds folder
  const debugApkSrc = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const debugApkDest = path.join(BUILD_DIR, 'turbo-cpp-mobile-debug.apk');
  
  if (fs.existsSync(debugApkSrc)) {
    fs.copyFileSync(debugApkSrc, debugApkDest);
    console.log(`✅ Debug APK created: ${debugApkDest}`);
    
    const stats = fs.statSync(debugApkDest);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
  }
  
  // Build release APK (if keystore is configured)
  const keystorePath = path.join(__dirname, '..', 'release-key.keystore');
  
  if (fs.existsSync(keystorePath)) {
    console.log('Building RELEASE APK (signed)...');
    execSync('./gradlew assembleRelease', { stdio: 'inherit' });
    
    const releaseApkSrc = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    const releaseApkDest = path.join(BUILD_DIR, 'turbo-cpp-mobile.apk');
    
    if (fs.existsSync(releaseApkSrc)) {
      fs.copyFileSync(releaseApkSrc, releaseApkDest);
      console.log(`✅ Release APK created: ${releaseApkDest}`);
      
      const stats = fs.statSync(releaseApkDest);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
    }
  } else {
    console.log('⚠️  No keystore found. Skipping release build.');
    console.log('   To create a release APK, generate a keystore first:\n');
    console.log('   keytool -genkey -v -keystore release-key.keystore -alias turbo-cpp-key -keyalg RSA -keysize 2048 -validity 10000\n');
    
    // Use debug APK as fallback
    const debugApkDest = path.join(BUILD_DIR, 'turbo-cpp-mobile-debug.apk');
    const fallbackApkDest = path.join(BUILD_DIR, 'turbo-cpp-mobile.apk');
    fs.copyFileSync(debugApkDest, fallbackApkDest);
  }
  
  console.log('✅ Android APK build completed\n');
  
} catch (error) {
  console.error('❌ Android build failed');
  console.error(error.message);
  process.exit(1);
}

// Step 5: Generate build info
console.log('📋 Step 5: Generating build info...');

const buildInfo = {
  version: require('../package.json').version,
  versionCode: 1,
  buildDate: new Date().toISOString(),
  platform: 'android',
  buildType: fs.existsSync(path.join(__dirname, '..', 'release-key.keystore')) ? 'release' : 'debug',
  files: fs.readdirSync(BUILD_DIR).filter(f => f.endsWith('.apk'))
};

fs.writeFileSync(
  path.join(BUILD_DIR, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('✅ Build info generated\n');

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('🎉 BUILD COMPLETED SUCCESSFULLY!');
console.log('═══════════════════════════════════════════════════');
console.log(`Version: ${buildInfo.version}`);
console.log(`Build Type: ${buildInfo.buildType.toUpperCase()}`);
console.log(`Build Date: ${buildInfo.buildDate}`);
console.log('\nGenerated files:');
buildInfo.files.forEach(file => {
  const filePath = path.join(BUILD_DIR, file);
  const stats = fs.statSync(filePath);
  console.log(`  • ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
});
console.log('\nTo install on Android device:');
console.log('  1. Transfer APK to your device');
console.log('  2. Enable "Install from Unknown Sources" in Settings');
console.log('  3. Open APK file and tap Install');
console.log('\nOr use ADB:');
console.log(`  adb install ${path.join(BUILD_DIR, 'turbo-cpp-mobile.apk')}`);
console.log('═══════════════════════════════════════════════════\n');
