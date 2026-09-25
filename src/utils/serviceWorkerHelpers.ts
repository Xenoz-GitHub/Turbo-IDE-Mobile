/**
 * Service Worker Helper Functions
 * Handles registration of periodic sync, background sync, and push notifications
 */

/**
 * Register periodic background sync
 * Checks for updates regularly even when app is closed
 */
export async function registerPeriodicSync(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('periodicSync' in (navigator as any).serviceWorker.ready)) {
      console.log('[PWA] Periodic Background Sync not supported');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const status = await (navigator as any).permissions.query({
      name: 'periodic-background-sync',
    });

    if (status.state === 'granted') {
      // Register periodic sync to check for updates every 24 hours
      await (registration as any).periodicSync.register('check-updates', {
        minInterval: 24 * 60 * 60 * 1000, // 24 hours
      });

      console.log('[PWA] Periodic sync registered successfully');
      return true;
    } else {
      console.log('[PWA] Periodic sync permission not granted');
      return false;
    }
  } catch (error) {
    console.error('[PWA] Failed to register periodic sync:', error);
    return false;
  }
}

/**
 * Register background sync
 * Syncs data when connection is restored
 */
export async function registerBackgroundSync(tag: string = 'sync-user-files'): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('sync' in (navigator as any).serviceWorker.ready)) {
      console.log('[PWA] Background Sync not supported');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);

    console.log(`[PWA] Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error('[PWA] Failed to register background sync:', error);
    return false;
  }
}

/**
 * Request notification permission and subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[PWA] Push notifications not supported');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('[PWA] Notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push notifications
      // Note: In production, you need a valid VAPID public key
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('[PWA] Push notification subscription created');
    } else {
      console.log('[PWA] Already subscribed to push notifications');
    }

    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PWA] Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PWA] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Check if periodic sync is supported
 */
export function isPeriodicSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'periodicSync' in (navigator as any).serviceWorker.ready;
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'sync' in (navigator as any).serviceWorker.ready;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationsSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return 'Notification' in window ? Notification.permission : 'denied';
}

/**
 * Initialize all PWA features
 */
export async function initializePWAFeatures() {
  console.log('[PWA] Initializing advanced features...');

  // Register periodic sync
  const periodicSyncEnabled = await registerPeriodicSync();
  
  // Register background sync for offline resilience
  if (isBackgroundSyncSupported()) {
    await registerBackgroundSync('sync-user-files');
  }

  // Request push notification permission (optional, only if user wants updates)
  // Uncomment to enable automatic push subscription
  // await subscribeToPushNotifications();

  console.log('[PWA] Initialization complete', {
    periodicSync: periodicSyncEnabled,
    backgroundSync: isBackgroundSyncSupported(),
    pushNotifications: isPushNotificationsSupported(),
    notificationPermission: getNotificationPermission(),
  });
}
