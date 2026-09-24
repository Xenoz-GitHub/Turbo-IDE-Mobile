/**
 * PWA Validator Utility
 * Checks PWA compliance and reports issues
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

export interface PWACheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface PWAValidationResult {
  isValid: boolean;
  score: number;
  checks: PWACheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Validate PWA compliance
 */
export async function validatePWA(): Promise<PWAValidationResult> {
  const checks: PWACheck[] = [];

  // Check 1: HTTPS
  const isHTTPS = window.location.protocol === 'https:' || 
                  window.location.hostname === 'localhost';
  checks.push({
    name: 'HTTPS',
    passed: isHTTPS,
    message: isHTTPS 
      ? 'Site is served over HTTPS' 
      : 'PWA requires HTTPS (or localhost for development)',
    severity: 'error',
  });

  // Check 2: Service Worker
  const hasSW = 'serviceWorker' in navigator;
  checks.push({
    name: 'Service Worker Support',
    passed: hasSW,
    message: hasSW 
      ? 'Service Worker API is supported' 
      : 'Browser does not support Service Workers',
    severity: 'error',
  });

  // Check 3: Service Worker Registration
  let swRegistered = false;
  if (hasSW) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      swRegistered = !!registration;
      checks.push({
        name: 'Service Worker Registered',
        passed: swRegistered,
        message: swRegistered 
          ? 'Service Worker is registered and active' 
          : 'Service Worker is not registered',
        severity: 'error',
      });
    } catch {
      checks.push({
        name: 'Service Worker Registered',
        passed: false,
        message: 'Failed to check Service Worker registration',
        severity: 'error',
      });
    }
  }

  // Check 4: Manifest
  const hasManifest = document.querySelector('link[rel="manifest"]');
  checks.push({
    name: 'Web App Manifest',
    passed: !!hasManifest,
    message: hasManifest 
      ? 'Manifest file is linked' 
      : 'No manifest file found',
    severity: 'error',
  });

  // Check 5: Fetch Manifest Content
  if (hasManifest) {
    try {
      const manifestUrl = (hasManifest as HTMLLinkElement).href;
      const response = await fetch(manifestUrl);
      const manifest = await response.json();

      // Check manifest properties
      const hasName = !!manifest.name;
      checks.push({
        name: 'Manifest Name',
        passed: hasName,
        message: hasName ? `App name: ${manifest.name}` : 'Manifest missing "name" property',
        severity: 'error',
      });

      const hasIcons = manifest.icons && manifest.icons.length > 0;
      checks.push({
        name: 'Manifest Icons',
        passed: hasIcons,
        message: hasIcons 
          ? `${manifest.icons.length} icon(s) defined` 
          : 'Manifest missing icons',
        severity: 'error',
      });

      const hasStartUrl = !!manifest.start_url;
      checks.push({
        name: 'Start URL',
        passed: hasStartUrl,
        message: hasStartUrl 
          ? `Start URL: ${manifest.start_url}` 
          : 'Manifest missing "start_url"',
        severity: 'warning',
      });

      const hasDisplay = !!manifest.display;
      checks.push({
        name: 'Display Mode',
        passed: hasDisplay,
        message: hasDisplay 
          ? `Display: ${manifest.display}` 
          : 'Manifest missing "display" property',
        severity: 'warning',
      });
    } catch (error) {
      checks.push({
        name: 'Manifest Content',
        passed: false,
        message: 'Failed to fetch or parse manifest file',
        severity: 'error',
      });
    }
  }

  // Check 6: Icons
  const icon192 = document.querySelector('link[rel="icon"][sizes="192x192"]');
  const icon512 = document.querySelector('link[rel="icon"][sizes="512x512"]');
  checks.push({
    name: 'App Icons',
    passed: !!(icon192 || icon512),
    message: icon192 && icon512 
      ? 'All required icon sizes present' 
      : 'Missing recommended icon sizes (192x192, 512x512)',
    severity: 'warning',
  });

  // Check 7: Apple Touch Icon (for iOS)
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  checks.push({
    name: 'Apple Touch Icon',
    passed: !!appleTouchIcon,
    message: appleTouchIcon 
      ? 'iOS home screen icon configured' 
      : 'No Apple Touch Icon (recommended for iOS)',
    severity: 'info',
  });

  // Check 8: Theme Color
  const themeColor = document.querySelector('meta[name="theme-color"]');
  checks.push({
    name: 'Theme Color',
    passed: !!themeColor,
    message: themeColor 
      ? `Theme color: ${(themeColor as HTMLMetaElement).content}` 
      : 'No theme color meta tag',
    severity: 'warning',
  });

  // Check 9: Viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  checks.push({
    name: 'Viewport Meta',
    passed: !!viewport,
    message: viewport 
      ? 'Viewport is configured for mobile' 
      : 'Missing viewport meta tag',
    severity: 'error',
  });

  // Check 10: Installability
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
  checks.push({
    name: 'Installation Status',
    passed: true, // Not a pass/fail, just info
    message: isStandalone 
      ? 'App is installed (running in standalone mode)' 
      : 'App is running in browser (not installed)',
    severity: 'info',
  });

  // Check 11: Offline Support
  const isOnline = navigator.onLine;
  checks.push({
    name: 'Network Status',
    passed: true, // Not a pass/fail
    message: isOnline ? 'Device is online' : 'Device is offline',
    severity: 'info',
  });

  // Calculate results
  const passed = checks.filter(c => c.passed && c.severity !== 'info').length;
  const failed = checks.filter(c => !c.passed && c.severity === 'error').length;
  const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length;
  const totalRequired = checks.filter(c => c.severity === 'error').length;
  
  const score = totalRequired > 0 ? Math.round((passed / totalRequired) * 100) : 100;
  const isValid = failed === 0;

  return {
    isValid,
    score,
    checks,
    summary: {
      passed,
      failed,
      warnings,
    },
  };
}

/**
 * Get installability status
 */
export function getInstallabilityStatus(): {
  canInstall: boolean;
  isInstalled: boolean;
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
  reason?: string;
} {
  const ua = navigator.userAgent.toLowerCase();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;

  let platform: 'android' | 'ios' | 'desktop' | 'unknown' = 'unknown';
  
  if (/android/.test(ua)) {
    platform = 'android';
  } else if (/iphone|ipad|ipod/.test(ua)) {
    platform = 'ios';
  } else if (/windows|mac|linux/.test(ua)) {
    platform = 'desktop';
  }

  if (isStandalone) {
    return {
      canInstall: false,
      isInstalled: true,
      platform,
      reason: 'App is already installed',
    };
  }

  // Check if browser supports installation
  if (platform === 'ios') {
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    return {
      canInstall: isSafari,
      isInstalled: false,
      platform,
      reason: isSafari 
        ? 'Use Safari Share > Add to Home Screen' 
        : 'Open in Safari to install',
    };
  }

  if (platform === 'android') {
    const isChrome = /chrome/.test(ua) && !/edg/.test(ua);
    return {
      canInstall: isChrome,
      isInstalled: false,
      platform,
      reason: isChrome 
        ? 'Chrome will prompt to install' 
        : 'Use Chrome for best experience',
    };
  }

  return {
    canInstall: true,
    isInstalled: false,
    platform,
    reason: 'Desktop PWA installation supported',
  };
}

/**
 * Format validation result for console
 */
export function formatValidationReport(result: PWAValidationResult): string {
  const lines: string[] = [];
  
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('   PWA VALIDATION REPORT');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`Overall Score: ${result.score}/100`);
  lines.push(`Status: ${result.isValid ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push('');
  lines.push(`Summary:`);
  lines.push(`  Passed:   ${result.summary.passed}`);
  lines.push(`  Failed:   ${result.summary.failed}`);
  lines.push(`  Warnings: ${result.summary.warnings}`);
  lines.push('');
  lines.push('Checks:');
  lines.push('');

  result.checks.forEach(check => {
    const icon = check.passed ? '✓' : '✗';
    const severity = check.severity.toUpperCase().padEnd(7);
    lines.push(`  ${icon} [${severity}] ${check.name}`);
    lines.push(`     ${check.message}`);
    lines.push('');
  });

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

/**
 * Run validation and log to console
 */
export async function validateAndLog(): Promise<PWAValidationResult> {
  const result = await validatePWA();
  console.log(formatValidationReport(result));
  return result;
}
