/**
 * Auto-Update Service for Turbo C++ Mobile
 * Checks for new versions and manages update notifications
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import { APP_VERSION } from '../config/version';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  versionCode: number;
  critical: boolean;
  changelog: string[];
  downloadUrl: string;
  fileSize: number;
}

export interface VersionInfo {
  version: string;
  versionCode: number;
}

class UpdateService {
  private apiBaseUrl: string;
  private currentVersion: VersionInfo;
  private checkInterval: number = 1000 * 60 * 60; // Check every hour
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Use environment variable or default to current origin
    this.apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    
    // Current app version from config
    this.currentVersion = {
      version: APP_VERSION.version,
      versionCode: APP_VERSION.versionCode
    };
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): VersionInfo {
    return this.currentVersion;
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/check-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.currentVersion),
      });

      if (!response.ok) {
        console.warn('Update check failed:', response.statusText);
        return null;
      }

      const updateInfo: UpdateInfo = await response.json();
      
      // Store last check time
      localStorage.setItem('tc_last_update_check', Date.now().toString());
      
      if (updateInfo.hasUpdate) {
        localStorage.setItem('tc_update_available', JSON.stringify(updateInfo));
      } else {
        localStorage.removeItem('tc_update_available');
      }

      return updateInfo;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    }
  }

  /**
   * Get cached update info if available
   */
  getCachedUpdateInfo(): UpdateInfo | null {
    try {
      const cached = localStorage.getItem('tc_update_available');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  /**
   * Download the APK file
   */
  async downloadAPK(): Promise<void> {
    const downloadUrl = `${this.apiBaseUrl}/api/download/apk`;
    
    // Open download in new tab (works on Android)
    window.open(downloadUrl, '_blank');
    
    // Track download
    this.trackInstall();
  }

  /**
   * Track installation for analytics
   */
  async trackInstall(): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/api/analytics/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: this.currentVersion.version,
          platform: this.getPlatform(),
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error tracking install:', error);
    }
  }

  /**
   * Detect user platform
   */
  private getPlatform(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/windows/.test(ua)) return 'windows';
    if (/mac/.test(ua)) return 'macos';
    if (/linux/.test(ua)) return 'linux';
    return 'unknown';
  }

  /**
   * Start automatic update checking
   */
  startAutoCheck(callback?: (updateInfo: UpdateInfo) => void): void {
    // Initial check
    this.checkForUpdates().then(updateInfo => {
      if (updateInfo?.hasUpdate && callback) {
        callback(updateInfo);
      }
    });

    // Periodic checks
    this.intervalId = setInterval(async () => {
      const updateInfo = await this.checkForUpdates();
      if (updateInfo?.hasUpdate && callback) {
        callback(updateInfo);
      }
    }, this.checkInterval);
  }

  /**
   * Stop automatic update checking
   */
  stopAutoCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check if it's time to check for updates (rate limiting)
   */
  shouldCheckForUpdates(): boolean {
    const lastCheck = localStorage.getItem('tc_last_update_check');
    if (!lastCheck) return true;

    const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
    const minInterval = 1000 * 60 * 30; // Minimum 30 minutes between checks

    return timeSinceLastCheck >= minInterval;
  }

  /**
   * Dismiss update notification
   */
  dismissUpdate(): void {
    localStorage.setItem('tc_update_dismissed', Date.now().toString());
  }

  /**
   * Check if update was dismissed recently
   */
  wasUpdateDismissedRecently(): boolean {
    const dismissed = localStorage.getItem('tc_update_dismissed');
    if (!dismissed) return false;

    const timeSinceDismiss = Date.now() - parseInt(dismissed);
    const dismissDuration = 1000 * 60 * 60 * 24; // Show again after 24 hours

    return timeSinceDismiss < dismissDuration;
  }
}

export const updateService = new UpdateService();
