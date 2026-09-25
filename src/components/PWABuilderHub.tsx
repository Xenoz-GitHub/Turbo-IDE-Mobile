import { Download, ExternalLink, CheckCircle2, AlertCircle, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { validatePWA, formatBytes, type PWAValidationResult } from '../utils/pwaValidation';
import { AppIcon } from './AppIcon';

interface PWAStatus {
  manifestDetected: boolean;
  manifestCompliant: boolean;
  serviceWorkerActive: boolean;
  serviceWorkerPrecached: boolean;
  displayMode: string;
  installationState: string;
  isInstallable: boolean;
  isInstalled: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWABuilderHubProps {
  onClose: () => void;
}

export default function PWABuilderHub({ onClose }: PWABuilderHubProps) {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    manifestDetected: false,
    manifestCompliant: false,
    serviceWorkerActive: false,
    serviceWorkerPrecached: false,
    displayMode: 'browser',
    installationState: 'not-ready',
    isInstallable: false,
    isInstalled: false,
  });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [validationResult, setValidationResult] = useState<PWAValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Check PWA status
  useEffect(() => {
    const checkPWAStatus = async () => {
      const status: PWAStatus = {
        manifestDetected: false,
        manifestCompliant: false,
        serviceWorkerActive: false,
        serviceWorkerPrecached: false,
        displayMode: 'browser',
        installationState: 'not-ready',
        isInstallable: false,
        isInstalled: false,
      };

      // Check manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        status.manifestDetected = true;
        try {
          const manifestUrl = manifestLink.getAttribute('href');
          if (manifestUrl) {
            const response = await fetch(manifestUrl);
            const manifest = await response.json();
            
            // Check manifest compliance
            const hasName = !!manifest.name;
            const hasShortName = !!manifest.short_name;
            const hasStartUrl = !!manifest.start_url;
            const hasDisplay = !!manifest.display;
            const hasIcons = manifest.icons && manifest.icons.length >= 2;
            
            status.manifestCompliant = hasName && hasShortName && hasStartUrl && hasDisplay && hasIcons;
          }
        } catch (error) {
          console.error('Error checking manifest:', error);
        }
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            status.serviceWorkerActive = !!registration.active;
            
            // Check if precached (check for cached resources)
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              status.serviceWorkerPrecached = cacheNames.length > 0;
            }
          }
        } catch (error) {
          console.error('Error checking service worker:', error);
        }
      }

      // Check display mode
      const displayMode = window.matchMedia('(display-mode: standalone)').matches
        ? 'standalone'
        : window.matchMedia('(display-mode: fullscreen)').matches
        ? 'fullscreen'
        : window.matchMedia('(display-mode: minimal-ui)').matches
        ? 'minimal-ui'
        : 'browser';
      
      status.displayMode = displayMode;
      status.isInstalled = displayMode === 'standalone' || displayMode === 'fullscreen';

      // Determine installation state
      if (status.isInstalled) {
        status.installationState = 'installed';
      } else if (status.manifestCompliant && status.serviceWorkerActive) {
        status.installationState = 'ready';
        status.isInstallable = true;
      } else {
        status.installationState = 'not-ready';
      }

      setPwaStatus(status);
    };

    checkPWAStatus();
    runValidation();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setPwaStatus((prev) => ({ ...prev, isInstallable: true, installationState: 'ready' }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setPwaStatus((prev) => ({ ...prev, isInstalled: true, installationState: 'installed' }));
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const result = await validatePWA();
      setValidationResult(result);
    } catch (error) {
      console.error('Error running PWA validation:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInstallWebAPK = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setPwaStatus((prev) => ({ ...prev, isInstalled: true, installationState: 'installed' }));
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setInstallPrompt(null);
      } catch (error) {
        console.error('Error showing install prompt:', error);
        alert('Installation prompt failed. Please use your browser menu (⋮) and select "Install app" or "Add to Home screen".');
      }
    } else {
      // Fallback: guide user to manual installation
      alert('To install: Tap your browser menu (⋮ three dots) → "Install app" or "Add to Home screen"');
    }
  };

  const StatusBadge = ({ active, label }: { active: boolean; label: string }) => (
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
      {active ? (
        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />
      )}
      <span className={`leading-tight ${active ? 'text-green-400' : 'text-yellow-400'}`}>{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-3 sm:p-4 md:p-6 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <AppIcon size={40} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1 leading-tight">
                INSTALL ANDROID APP
              </h2>
              <p className="text-blue-200 text-xs sm:text-sm hidden sm:block">
                Install Turbo C++ Mobile as a native Android app (WebAPK)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-1.5 sm:p-2 rounded transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-4">
                  Native WebAPK System (Chrome & Android)
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base mb-4 sm:mb-6">
                  On Android, modern Chromium browsers generate an authentic, signed system APK
                  (WebAPK) directly onto your device. It runs with complete full-screen immersion,
                  app icon in your app drawer, and full offline caching.
                </p>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-zinc-800 p-4 sm:p-6 rounded-lg border border-zinc-700">
                <div>
                  <div className="text-xs text-zinc-500 mb-2">PWA Manifest:</div>
                  <StatusBadge
                    active={pwaStatus.manifestCompliant}
                    label={pwaStatus.manifestCompliant ? 'Detected (100% Compliant)' : 'Not Compliant'}
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Service Worker:</div>
                  <StatusBadge
                    active={pwaStatus.serviceWorkerActive && pwaStatus.serviceWorkerPrecached}
                    label={
                      pwaStatus.serviceWorkerActive && pwaStatus.serviceWorkerPrecached
                        ? 'Active & Precached'
                        : 'Not Active'
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Display Mode:</div>
                  <StatusBadge
                    active={pwaStatus.displayMode === 'standalone' || pwaStatus.displayMode === 'fullscreen'}
                    label={
                      pwaStatus.displayMode === 'standalone' || pwaStatus.displayMode === 'fullscreen'
                        ? 'Standalone Fullscreen'
                        : 'Browser Mode'
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Installation State:</div>
                  <StatusBadge
                    active={pwaStatus.installationState === 'ready' || pwaStatus.installationState === 'installed'}
                    label={
                      pwaStatus.installationState === 'installed'
                        ? 'Already Installed'
                        : pwaStatus.installationState === 'ready'
                        ? 'Ready to Install'
                        : 'Not Ready'
                    }
                  />
                </div>
              </div>

              {/* Install Button */}
              {!pwaStatus.isInstalled && (
                <>
                  <button
                    onClick={handleInstallWebAPK}
                    className="w-full py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="leading-tight">
                      {pwaStatus.isInstallable ? 'Install WebAPK on Android Now' : 'Show Installation Instructions'}
                    </span>
                  </button>

                  {/* Installation status info */}
                  {!pwaStatus.isInstallable && (
                    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 sm:p-4 text-blue-200 text-xs sm:text-sm">
                      <p className="font-semibold mb-1">Installation Ready</p>
                      <p>
                        The install prompt may not be available yet. Tap the button above for manual installation instructions,
                        or look for the "Install" option in your browser menu (⋮).
                      </p>
                    </div>
                  )}
                </>
              )}

              {pwaStatus.isInstalled && (
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 sm:p-4 text-center">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-semibold text-sm sm:text-base">Already Installed as WebAPK!</p>
                  <p className="text-green-300 text-xs sm:text-sm mt-1">
                    Check your app drawer for the Turbo C++ icon
                  </p>
                </div>
              )}

              {/* Manual Steps */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 sm:p-6">
                <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  Manual Installation Steps (if prompt is suppressed):
                </h4>
                <ol className="space-y-1.5 sm:space-y-2 text-zinc-400 text-xs sm:text-sm list-decimal list-inside">
                  <li>Tap the three vertical dots in Chrome top right.</li>
                  <li>Tap "Install app" or "Add to Home screen".</li>
                  <li>Confirm install to receive the native Android icon.</li>
                </ol>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
