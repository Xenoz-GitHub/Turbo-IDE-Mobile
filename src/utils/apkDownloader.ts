/**
 * APK Download Utility
 * Handles real APK file downloads from the server
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

export interface ApkDownloadOptions {
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  trackAnalytics?: boolean;
}

/**
 * Download the real APK file from the server
 */
export async function downloadRealApk(options: ApkDownloadOptions = {}): Promise<boolean> {
  const {
    onStart,
    onSuccess,
    onError,
    trackAnalytics = true
  } = options;

  try {
    // Get API base URL
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const downloadUrl = `${apiUrl}/api/download/apk`;

    if (onStart) {
      onStart();
    }

    // Check if APK exists on server
    const checkResponse = await fetch(`${apiUrl}/api/version`);
    
    if (!checkResponse.ok) {
      throw new Error('Unable to reach update server');
    }

    const versionInfo = await checkResponse.json();

    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `turbo-cpp-mobile-v${versionInfo.version}.apk`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track analytics if enabled
    if (trackAnalytics) {
      await trackApkDownload(apiUrl, versionInfo.version);
    }

    if (onSuccess) {
      onSuccess();
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Download failed. Please check your internet connection.';
    
    console.error('[APK Download] Error:', error);
    
    if (onError) {
      onError(errorMessage);
    }

    return false;
  }
}

/**
 * Track APK download for analytics
 */
async function trackApkDownload(apiUrl: string, version: string): Promise<void> {
  try {
    await fetch(`${apiUrl}/api/analytics/install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        platform: detectPlatform(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        downloadType: 'direct-apk',
      }),
    });
  } catch (error) {
    // Don't fail the download if analytics fails
    console.warn('[APK Download] Analytics tracking failed:', error);
  }
}

/**
 * Detect user platform
 */
function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/windows/.test(ua)) return 'windows';
  if (/mac/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';
  
  return 'unknown';
}

/**
 * Check if device can install APK files
 */
export function canInstallApk(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

/**
 * Get user-friendly install instructions based on platform
 */
export function getInstallInstructions(): string[] {
  const platform = detectPlatform();

  switch (platform) {
    case 'android':
      return [
        'Download will start automatically',
        'Open Downloads folder or notification',
        'Tap the APK file to install',
        'Enable "Install from Unknown Sources" if prompted',
        'Tap "Install" to complete installation',
      ];
    
    case 'ios':
      return [
        'iOS does not support APK files',
        'Use "Add to Home Screen" from Safari instead',
        'Tap Share button in Safari',
        'Select "Add to Home Screen"',
        'Tap "Add" to install PWA',
      ];
    
    default:
      return [
        'APK files are for Android devices only',
        'Transfer this file to your Android device',
        'Open the file on Android to install',
        'Or use the web version directly in browser',
      ];
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Open APK download in new tab (alternative method)
 */
export function openApkInNewTab(): void {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const downloadUrl = `${apiUrl}/api/download/apk`;
  
  window.open(downloadUrl, '_blank', 'noopener,noreferrer');
}
