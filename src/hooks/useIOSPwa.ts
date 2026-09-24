/**
 * iOS PWA Hook
 * Manages iOS PWA state, installation, and updates
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import { useEffect, useState, useCallback } from 'react';
import {
  detectIOSDevice,
  checkIOSPWAUpdate,
  updateIOSPWAVersion,
  wasIOSPromptDismissed,
  dismissIOSPrompt,
  shouldShowIOSUpdatePrompt,
  markIOSUpdatePromptShown,
  trackIOSInstallation,
  applyIOSOptimizations,
  isInAppBrowser,
  type iOSDeviceInfo,
} from '../utils/iosPwaHelper';

interface IOSUpdateInfo {
  hasUpdate: boolean;
  version?: string;
  changelog?: string[];
}

interface UseIOSPwaReturn extends iOSDeviceInfo {
  showInstallPrompt: boolean;
  showUpdatePrompt: boolean;
  updateInfo: IOSUpdateInfo | null;
  isInAppBrowser: boolean;
  dismissInstallPrompt: () => void;
  dismissUpdatePrompt: () => void;
  checkForUpdates: () => Promise<void>;
  openInSafari: () => void;
}

export function useIOSPwa(): UseIOSPwaReturn {
  const [deviceInfo] = useState<iOSDeviceInfo>(detectIOSDevice());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<IOSUpdateInfo | null>(null);
  const [inAppBrowser] = useState(isInAppBrowser());

  /**
   * Check for updates
   */
  const checkForUpdates = useCallback(async () => {
    if (!deviceInfo.isStandalone) return;

    try {
      const update = await checkIOSPWAUpdate();
      
      if (update.hasUpdate) {
        setUpdateInfo(update);
        
        if (shouldShowIOSUpdatePrompt()) {
          setShowUpdatePrompt(true);
          markIOSUpdatePromptShown();
        }
      }
    } catch (error) {
      console.error('[iOS PWA] Error checking for updates:', error);
    }
  }, [deviceInfo.isStandalone]);

  /**
   * Dismiss install prompt
   */
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    dismissIOSPrompt();
  }, []);

  /**
   * Dismiss update prompt
   */
  const dismissUpdatePrompt = useCallback(() => {
    setShowUpdatePrompt(false);
  }, []);

  /**
   * Open current URL in Safari (from in-app browser)
   */
  const openInSafari = useCallback(() => {
    const url = window.location.href;
    
    // Try different methods to open in Safari
    // Method 1: Direct protocol
    window.location.href = `x-safari-${url}`;
    
    // Method 2: Standard approach (fallback)
    setTimeout(() => {
      window.open(url, '_blank');
    }, 100);
  }, []);

  /**
   * Apply iOS optimizations on mount
   */
  useEffect(() => {
    if (deviceInfo.isIOS) {
      applyIOSOptimizations();
    }
  }, [deviceInfo.isIOS]);

  /**
   * Track installation
   */
  useEffect(() => {
    if (deviceInfo.isStandalone) {
      trackIOSInstallation();
    }
  }, [deviceInfo.isStandalone]);

  /**
   * Show install prompt for eligible devices
   */
  useEffect(() => {
    if (deviceInfo.canAddToHomeScreen && !wasIOSPromptDismissed() && !inAppBrowser) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [deviceInfo.canAddToHomeScreen, inAppBrowser]);

  /**
   * Check for updates periodically if standalone
   */
  useEffect(() => {
    if (!deviceInfo.isStandalone) return;

    // Check immediately
    checkForUpdates();

    // Check every hour
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [deviceInfo.isStandalone, checkForUpdates]);

  /**
   * Listen for app resume (when user returns to app)
   */
  useEffect(() => {
    if (!deviceInfo.isStandalone) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // App resumed, check for updates
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [deviceInfo.isStandalone, checkForUpdates]);

  return {
    ...deviceInfo,
    showInstallPrompt,
    showUpdatePrompt,
    updateInfo,
    isInAppBrowser: inAppBrowser,
    dismissInstallPrompt,
    dismissUpdatePrompt,
    checkForUpdates,
    openInSafari,
  };
}
