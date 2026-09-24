/**
 * Service Worker Hook with Update Management
 * Handles registration, update detection, and communication
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
  cacheSize: number;
}

interface UpdateInfo {
  version: string;
  versionCode: number;
  changelog: string[];
}

export function useServiceWorker(onUpdateAvailable?: (info: UpdateInfo) => void) {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
    error: null,
    cacheSize: 0,
  });

  /**
   * Register service worker
   */
  const register = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Service Workers are not supported in this browser',
      }));
      return;
    }

    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw-custom.js', {
        scope: '/',
      });

      console.log('[App] Service Worker registered:', registration);

      setState((prev) => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null,
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[App] New service worker version available');
              setState((prev) => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });

      // Check for updates immediately
      registration.update();

      return registration;
    } catch (error) {
      console.error('[App] Service Worker registration failed:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
    }
  }, [state.isSupported]);

  /**
   * Listen for messages from service worker
   */
  useEffect(() => {
    if (!state.isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, version, versionCode, changelog } = event.data;

      switch (type) {
        case 'UPDATE_AVAILABLE':
          console.log('[App] Update available:', version);
          setState((prev) => ({ ...prev, isUpdateAvailable: true }));

          if (onUpdateAvailable) {
            onUpdateAvailable({ version, versionCode, changelog });
          }
          break;

        case 'TRIGGER_UPDATE':
          // Triggered from notification click
          if (onUpdateAvailable) {
            onUpdateAvailable(event.data.data);
          }
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [state.isSupported, onUpdateAvailable]);

  /**
   * Skip waiting and activate new service worker
   */
  const skipWaiting = useCallback(() => {
    if (!state.registration) return;

    const newWorker = state.registration.waiting;

    if (newWorker) {
      // Tell service worker to skip waiting
      newWorker.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when new worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, [state.registration]);

  /**
   * Manually check for updates
   */
  const checkForUpdates = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();

      // Also send message to service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_UPDATE',
        });
      }
    } catch (error) {
      console.error('[App] Error checking for updates:', error);
    }
  }, [state.registration]);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!navigator.serviceWorker.controller) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }, []);

  /**
   * Get total cache size
   */
  const getCacheSize = useCallback(async (): Promise<number> => {
    if (!navigator.serviceWorker.controller) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        const size = event.data.size || 0;
        setState((prev) => ({ ...prev, cacheSize: size }));
        resolve(size);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(0), 5000);
    });
  }, []);

  /**
   * Unregister service worker
   */
  const unregister = useCallback(async (): Promise<boolean> => {
    if (!state.registration) return false;

    try {
      const success = await state.registration.unregister();
      if (success) {
        setState((prev) => ({
          ...prev,
          isRegistered: false,
          registration: null,
        }));
      }
      return success;
    } catch (error) {
      console.error('[App] Error unregistering service worker:', error);
      return false;
    }
  }, [state.registration]);

  /**
   * Auto-register on mount
   */
  useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      register();
    }
  }, [state.isSupported, state.isRegistered, register]);

  /**
   * Get cache size on mount
   */
  useEffect(() => {
    if (state.isRegistered) {
      getCacheSize();
    }
  }, [state.isRegistered, getCacheSize]);

  return {
    ...state,
    register,
    skipWaiting,
    checkForUpdates,
    clearCache,
    getCacheSize,
    unregister,
  };
}
