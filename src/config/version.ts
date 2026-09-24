/**
 * Version Configuration
 * Central source of truth for app version
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

export const APP_VERSION = {
  version: '1.0.0',
  versionCode: 1,
  buildDate: '2026-09-24',
  releaseChannel: 'stable' as 'stable' | 'beta' | 'alpha',
  codeName: 'Borland Legacy',
} as const;

export const VERSION_HISTORY = [
  {
    version: '1.0.0',
    versionCode: 1,
    releaseDate: '2026-09-24',
    changes: [
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
    breaking: false,
    critical: false,
  },
] as const;

export function getVersionString(): string {
  return `v${APP_VERSION.version}`;
}

export function getFullVersionString(): string {
  return `v${APP_VERSION.version} (${APP_VERSION.versionCode}) - ${APP_VERSION.codeName}`;
}

export function getBuildInfo(): string {
  return `Build ${APP_VERSION.versionCode} • ${APP_VERSION.buildDate} • ${APP_VERSION.releaseChannel}`;
}

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

export function isVersionNewer(newVersion: string, currentVersion: string): boolean {
  return compareVersions(newVersion, currentVersion) > 0;
}
