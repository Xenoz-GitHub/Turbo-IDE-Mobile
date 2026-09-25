/**
 * Custom Service Worker with Auto-Update Support
 * Turbo C++ Mobile - ENCRYPTED CREW
 * Handles offline caching, version checking, and update notifications
 */

const CACHE_NAME = 'turbo-cpp-mobile-v1.0.0';
const API_CACHE_NAME = 'turbo-cpp-api-cache';
const RUNTIME_CACHE_NAME = 'turbo-cpp-runtime';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force immediate activation
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== RUNTIME_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests separately
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle other requests (images, scripts, styles)
  event.respondWith(handleResourceRequest(request));
});

/**
 * Handle API requests - Network first, cache fallback
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Offline - No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle navigation requests - Cache first, network fallback
 */
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first for instant loading
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {});
      
      return cachedResponse;
    }
    
    // If not in cache, try network
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Both cache and network failed, show offline page
    console.log('[SW] Serving offline page');
    return cache.match('/offline.html');
  }
}

/**
 * Handle resource requests - Cache first, network fallback
 */
async function handleResourceRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Refresh cache in background
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {});
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return generic error
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Check for app updates periodically
 */
async function checkForUpdates() {
  try {
    const response = await fetch('/api/version');
    
    if (!response.ok) {
      return;
    }
    
    const versionInfo = await response.json();
    const currentVersion = CACHE_NAME.split('-v')[1];
    
    if (versionInfo.version !== currentVersion) {
      console.log('[SW] New version available:', versionInfo.version);
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: versionInfo.version,
          versionCode: versionInfo.versionCode,
          changelog: versionInfo.changelog
        });
      });
    }
  } catch (error) {
    console.error('[SW] Error checking for updates:', error);
  }
}

// Check for updates every 30 minutes
setInterval(checkForUpdates, 30 * 60 * 1000);

// Check immediately on activation
self.addEventListener('activate', () => {
  setTimeout(checkForUpdates, 5000);
});

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      // Force update by skipping waiting
      self.skipWaiting();
      break;
      
    case 'CHECK_UPDATE':
      // Manual update check
      checkForUpdates();
      break;
      
    case 'CLEAR_CACHE':
      // Clear all caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_SIZE':
      // Calculate total cache size
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;
  }
});

/**
 * Calculate total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

/**
 * Handle push notifications (for future update alerts)
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'A new version is available!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      action: data.action || 'UPDATE'
    },
    actions: [
      {
        action: 'update',
        title: 'Update Now'
      },
      {
        action: 'later',
        title: 'Later'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Turbo C++ Mobile Update',
      options
    )
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'update') {
    // Open app and trigger update
    event.waitUntil(
      clients.openWindow(event.notification.data.url).then((client) => {
        if (client) {
          client.postMessage({
            type: 'TRIGGER_UPDATE',
            data: event.notification.data
          });
        }
      })
    );
  }
});

console.log('[SW] Service worker script loaded');

/**
 * Periodic Background Sync - Check for updates regularly
 * Requires periodic-background-sync permission
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic background sync triggered:', event.tag);
  
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  } else if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

/**
 * Background Sync - Sync data when connection is restored
 * Handles offline actions and queued requests
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-user-files') {
    event.waitUntil(syncUserFiles());
  } else if (event.tag === 'sync-settings') {
    event.waitUntil(syncSettings());
  } else if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

/**
 * Sync user data in background
 */
async function syncUserData() {
  try {
    console.log('[SW] Syncing user data...');
    
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients to sync their data
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_DATA',
        timestamp: Date.now()
      });
    });
    
    // Check for updates while we're at it
    await checkForUpdates();
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Error syncing user data:', error);
    return Promise.reject(error);
  }
}

/**
 * Sync user files when connection is restored
 */
async function syncUserFiles() {
  try {
    console.log('[SW] Syncing user files...');
    
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients about sync
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_FILES',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Error syncing files:', error);
    return Promise.reject(error);
  }
}

/**
 * Sync settings when connection is restored
 */
async function syncSettings() {
  try {
    console.log('[SW] Syncing settings...');
    
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients about settings sync
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_SETTINGS',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Error syncing settings:', error);
    return Promise.reject(error);
  }
}
