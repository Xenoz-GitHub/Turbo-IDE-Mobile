/**
 * PWA Validation Utilities for PWABuilder Integration
 * Validates manifest, service worker, and calculates compliance scores
 */

export interface ManifestValidation {
  score: number;
  maxScore: number;
  percentage: number;
  issues: string[];
  warnings: string[];
  passes: string[];
}

export interface ServiceWorkerValidation {
  registered: boolean;
  active: boolean;
  scope: string;
  updateFound: boolean;
  cacheCount: number;
  cacheSize: number;
  offline: boolean;
}

export interface PWAValidationResult {
  manifest: ManifestValidation;
  serviceWorker: ServiceWorkerValidation;
  installability: {
    installable: boolean;
    reasons: string[];
  };
  overallScore: number;
  readyForStore: boolean;
}

/**
 * Validate PWA manifest compliance
 */
export async function validateManifest(): Promise<ManifestValidation> {
  const validation: ManifestValidation = {
    score: 0,
    maxScore: 100,
    percentage: 0,
    issues: [],
    warnings: [],
    passes: [],
  };

  try {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    
    if (!manifestLink) {
      validation.issues.push('No manifest link found in HTML');
      return validation;
    }

    const manifestUrl = manifestLink.getAttribute('href');
    if (!manifestUrl) {
      validation.issues.push('Manifest link has no href attribute');
      return validation;
    }

    const response = await fetch(manifestUrl);
    if (!response.ok) {
      validation.issues.push(`Failed to fetch manifest: ${response.status}`);
      return validation;
    }

    const manifest = await response.json();

    // Required fields (10 points each)
    const requiredFields = [
      { key: 'name', value: manifest.name, points: 10 },
      { key: 'short_name', value: manifest.short_name, points: 10 },
      { key: 'start_url', value: manifest.start_url, points: 10 },
      { key: 'display', value: manifest.display, points: 10 },
      { key: 'theme_color', value: manifest.theme_color, points: 10 },
      { key: 'background_color', value: manifest.background_color, points: 10 },
    ];

    requiredFields.forEach(field => {
      if (field.value) {
        validation.score += field.points;
        validation.passes.push(`✓ ${field.key}: ${field.value}`);
      } else {
        validation.issues.push(`Missing required field: ${field.key}`);
      }
    });

    // Icons validation (20 points)
    if (manifest.icons && Array.isArray(manifest.icons)) {
      const has192 = manifest.icons.some((icon: any) => 
        icon.sizes && icon.sizes.includes('192x192')
      );
      const has512 = manifest.icons.some((icon: any) => 
        icon.sizes && icon.sizes.includes('512x512')
      );
      const hasMaskable = manifest.icons.some((icon: any) => 
        icon.purpose && icon.purpose.includes('maskable')
      );

      if (has192 && has512) {
        validation.score += 15;
        validation.passes.push('✓ Icons: 192x192 and 512x512 present');
        
        if (hasMaskable) {
          validation.score += 5;
          validation.passes.push('✓ Maskable icon present');
        } else {
          validation.warnings.push('Consider adding a maskable icon for better Android integration');
        }
      } else {
        validation.issues.push('Missing required icon sizes (192x192 and 512x512)');
      }
    } else {
      validation.issues.push('No icons array found in manifest');
    }

    // Optional but recommended fields (5 points each)
    const optionalFields = [
      { key: 'description', value: manifest.description },
      { key: 'categories', value: manifest.categories },
      { key: 'screenshots', value: manifest.screenshots },
      { key: 'shortcuts', value: manifest.shortcuts },
    ];

    optionalFields.forEach(field => {
      if (field.value) {
        validation.score += 5;
        validation.passes.push(`✓ Optional: ${field.key}`);
      } else {
        validation.warnings.push(`Recommended: Add ${field.key} for better store listing`);
      }
    });

    // Display mode validation
    if (manifest.display === 'standalone' || manifest.display === 'fullscreen') {
      validation.passes.push('✓ Display mode optimized for app experience');
    } else if (manifest.display === 'minimal-ui') {
      validation.warnings.push('Consider using "standalone" or "fullscreen" display mode');
    }

    // Orientation
    if (manifest.orientation) {
      validation.passes.push(`✓ Orientation: ${manifest.orientation}`);
    }

    // Calculate percentage
    validation.percentage = Math.round((validation.score / validation.maxScore) * 100);

  } catch (error) {
    validation.issues.push(`Error validating manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return validation;
}

/**
 * Validate Service Worker
 */
export async function validateServiceWorker(): Promise<ServiceWorkerValidation> {
  const validation: ServiceWorkerValidation = {
    registered: false,
    active: false,
    scope: '',
    updateFound: false,
    cacheCount: 0,
    cacheSize: 0,
    offline: false,
  };

  try {
    if (!('serviceWorker' in navigator)) {
      return validation;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      validation.registered = true;
      validation.active = !!registration.active;
      validation.scope = registration.scope;
      validation.updateFound = !!registration.waiting || !!registration.installing;
    }

    // Check caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      validation.cacheCount = cacheNames.length;

      // Calculate total cache size
      let totalSize = 0;
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          } catch (error) {
            // Skip if error reading cache entry
          }
        }
      }
      
      validation.cacheSize = totalSize;
      validation.offline = totalSize > 0;
    }

  } catch (error) {
    console.error('Error validating service worker:', error);
  }

  return validation;
}

/**
 * Check PWA installability
 */
export async function checkInstallability(): Promise<{ installable: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  
  // Check if already installed
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                     window.matchMedia('(display-mode: fullscreen)').matches;
  
  if (isInstalled) {
    reasons.push('App is already installed');
    return { installable: false, reasons };
  }

  // Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    reasons.push('No manifest link found');
    return { installable: false, reasons };
  }

  // Check service worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.active) {
      reasons.push('No active service worker');
      return { installable: false, reasons };
    }
  } else {
    reasons.push('Service workers not supported');
    return { installable: false, reasons };
  }

  // Check HTTPS (except localhost)
  if (location.protocol !== 'https:' && !location.hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
    reasons.push('App must be served over HTTPS');
    return { installable: false, reasons };
  }

  reasons.push('All installability criteria met');
  return { installable: true, reasons };
}

/**
 * Complete PWA validation
 */
export async function validatePWA(): Promise<PWAValidationResult> {
  const [manifest, serviceWorker, installability] = await Promise.all([
    validateManifest(),
    validateServiceWorker(),
    checkInstallability(),
  ]);

  // Calculate overall score
  let overallScore = 0;
  
  // Manifest score (60% weight)
  overallScore += manifest.percentage * 0.6;
  
  // Service worker score (30% weight)
  const swScore = serviceWorker.registered && serviceWorker.active && serviceWorker.offline ? 100 : 0;
  overallScore += swScore * 0.3;
  
  // Installability (10% weight)
  const installScore = installability.installable ? 100 : 0;
  overallScore += installScore * 0.1;

  // Round to integer
  overallScore = Math.round(overallScore);

  // Ready for store if score >= 90 and all critical checks pass
  const readyForStore = 
    overallScore >= 90 &&
    manifest.issues.length === 0 &&
    serviceWorker.active &&
    serviceWorker.offline;

  return {
    manifest,
    serviceWorker,
    installability,
    overallScore,
    readyForStore,
  };
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate PWABuilder report URL
 */
export function generatePWABuilderURL(targetUrl: string): string {
  const encoded = encodeURIComponent(targetUrl);
  return `https://www.pwabuilder.com/?site=${encoded}`;
}

/**
 * Check if running in TWA
 */
export function isRunningInTWA(): boolean {
  return document.referrer.includes('android-app://');
}

/**
 * Check if running as installed PWA
 */
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as any).standalone === true; // iOS
}

/**
 * Get display mode
 */
export function getDisplayMode(): string {
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}
