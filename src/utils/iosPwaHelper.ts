/**
 * iOS PWA Helper Utilities
 * Enhanced detection and support for iOS Progressive Web Apps
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

export interface iOSDeviceInfo {
  isIOS: boolean;
  isIPad: boolean;
  isIPhone: boolean;
  isIPod: boolean;
  isSafari: boolean;
  isStandalone: boolean;
  isInstallable: boolean;
  iosVersion: string | null;
  canAddToHomeScreen: boolean;
}

/**
 * Detect iOS device and capabilities
 */
export function detectIOSDevice(): iOSDeviceInfo {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  const isIPad = /ipad/.test(ua) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIPhone = /iphone/.test(ua);
  const isIPod = /ipod/.test(ua);
  
  // Check if running in Safari
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua);
  
  // Check if running in standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
  
  // Extract iOS version
  let iosVersion: string | null = null;
  const versionMatch = ua.match(/os (\d+)_(\d+)_?(\d+)?/);
  if (versionMatch) {
    iosVersion = `${versionMatch[1]}.${versionMatch[2]}${versionMatch[3] ? '.' + versionMatch[3] : ''}`;
  }
  
  // Can add to home screen if: iOS + Safari + not standalone
  const canAddToHomeScreen = isIOS && isSafari && !isStandalone;
  
  // Is installable (not already installed)
  const isInstallable = isIOS && !isStandalone;

  return {
    isIOS,
    isIPad,
    isIPhone,
    isIPod,
    isSafari,
    isStandalone,
    isInstallable,
    iosVersion,
    canAddToHomeScreen,
  };
}

/**
 * Check if user dismissed iOS install prompt recently
 */
export function wasIOSPromptDismissed(): boolean {
  const dismissed = localStorage.getItem('ios_install_prompt_dismissed');
  if (!dismissed) return false;

  const dismissedTime = parseInt(dismissed);
  const daysSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
  
  // Show again after 7 days
  return daysSinceDismiss < 7;
}

/**
 * Mark iOS install prompt as dismissed
 */
export function dismissIOSPrompt(): void {
  localStorage.setItem('ios_install_prompt_dismissed', Date.now().toString());
}

/**
 * Check if this is the first visit
 */
export function isFirstVisit(): boolean {
  const visited = localStorage.getItem('ios_pwa_visited');
  if (!visited) {
    localStorage.setItem('ios_pwa_visited', 'true');
    return true;
  }
  return false;
}

/**
 * Get iOS-specific share instructions
 */
export function getIOSShareInstructions(): string[] {
  const device = detectIOSDevice();
  
  if (device.isIPad) {
    return [
      'Tap the Share button at the top of Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top-right corner',
      'The app icon will appear on your home screen',
    ];
  } else {
    return [
      'Tap the Share button at the bottom of Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top-right corner',
      'The app icon will appear on your home screen',
    ];
  }
}

/**
 * Trigger native iOS share sheet if available
 */
export async function triggerIOSShare(): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: 'Turbo C++ Mobile',
      text: 'Mobile C++ IDE with Borland Turbo C++ 3.0 compatibility',
      url: window.location.href,
    });
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('iOS share failed:', error);
    }
    return false;
  }
}

/**
 * Check if app needs update (for standalone iOS PWA)
 */
export async function checkIOSPWAUpdate(): Promise<{
  hasUpdate: boolean;
  version?: string;
  changelog?: string[];
}> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const response = await fetch(`${apiUrl}/api/version`);
    
    if (!response.ok) {
      return { hasUpdate: false };
    }

    const versionInfo = await response.json();
    const currentVersion = localStorage.getItem('ios_pwa_version');
    
    if (!currentVersion) {
      localStorage.setItem('ios_pwa_version', versionInfo.version);
      return { hasUpdate: false };
    }

    const hasUpdate = versionInfo.version !== currentVersion;
    
    return {
      hasUpdate,
      version: versionInfo.version,
      changelog: versionInfo.changelog,
    };
  } catch (error) {
    console.error('Error checking iOS PWA update:', error);
    return { hasUpdate: false };
  }
}

/**
 * Update stored iOS PWA version
 */
export function updateIOSPWAVersion(version: string): void {
  localStorage.setItem('ios_pwa_version', version);
}

/**
 * Get appropriate icon for iOS device
 */
export function getIOSIcon(): string {
  const device = detectIOSDevice();
  
  if (device.isIPad) {
    return '/apple-touch-icon.png'; // 180x180
  } else {
    return '/apple-touch-icon.png'; // 180x180
  }
}

/**
 * Optimize for iOS display modes
 */
export function applyIOSOptimizations(): void {
  const device = detectIOSDevice();
  
  if (!device.isIOS) return;

  // Prevent zoom on input focus
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && device.isStandalone) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  // Set theme color for iOS
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.setAttribute('name', 'theme-color');
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.setAttribute('content', '#0000AA');

  // Set apple-mobile-web-app-status-bar-style
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!statusBarMeta) {
    statusBarMeta = document.createElement('meta');
    statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(statusBarMeta);
  }
  statusBarMeta.setAttribute('content', 'black-translucent');

  // Handle safe areas for notched devices
  if (device.isStandalone) {
    document.body.style.paddingTop = 'env(safe-area-inset-top)';
    document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
  }
}

/**
 * Check if running in in-app browser (not Safari)
 */
export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  
  // Common in-app browsers
  const inAppBrowsers = [
    'instagram',
    'fbios', // Facebook
    'fban', // Facebook
    'twitter',
    'line',
    'wechat',
    'micromessenger',
    'linkedin',
    'snapchat',
    'tiktok',
    'whatsapp',
  ];

  return inAppBrowsers.some(browser => ua.includes(browser));
}

/**
 * Get instructions to open in Safari from in-app browser
 */
export function getOpenInSafariInstructions(): string[] {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('instagram')) {
    return [
      'Tap the "..." menu in the top-right corner',
      'Select "Open in Safari"',
      'Then follow the Add to Home Screen instructions',
    ];
  }
  
  if (ua.includes('fbios') || ua.includes('fban')) {
    return [
      'Tap the "..." menu in the top-right corner',
      'Select "Open in Safari"',
      'Then follow the Add to Home Screen instructions',
    ];
  }

  return [
    'Look for "Open in Browser" or "Open in Safari" option',
    'Usually found in the menu (three dots)',
    'Then follow the Add to Home Screen instructions',
  ];
}

/**
 * Track iOS PWA installation
 */
export function trackIOSInstallation(): void {
  const device = detectIOSDevice();
  
  if (device.isStandalone && !localStorage.getItem('ios_install_tracked')) {
    localStorage.setItem('ios_install_tracked', 'true');
    localStorage.setItem('ios_install_date', new Date().toISOString());
    
    // Track analytics
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    fetch(`${apiUrl}/api/analytics/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: '1.0.0',
        platform: 'ios-pwa',
        device: device.isIPad ? 'ipad' : device.isIPhone ? 'iphone' : 'ipod',
        iosVersion: device.iosVersion,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }
}

/**
 * Show iOS update prompt
 */
export function shouldShowIOSUpdatePrompt(): boolean {
  const device = detectIOSDevice();
  
  if (!device.isStandalone) return false;
  
  const lastPrompt = localStorage.getItem('ios_update_prompt_shown');
  if (!lastPrompt) return true;
  
  const daysSinceLastPrompt = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
  
  // Show again after 3 days
  return daysSinceLastPrompt >= 3;
}

/**
 * Mark iOS update prompt as shown
 */
export function markIOSUpdatePromptShown(): void {
  localStorage.setItem('ios_update_prompt_shown', Date.now().toString());
}
