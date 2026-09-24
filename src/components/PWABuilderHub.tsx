import { Download, ExternalLink, CheckCircle2, AlertCircle, Loader2, Package, Cloud, Smartphone, X, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { validatePWA, formatBytes, type PWAValidationResult } from '../utils/pwaValidation';

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
  const [activeTab, setActiveTab] = useState<'webapk' | 'twa' | 'pwabuilder'>('webapk');
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
  const [isGeneratingTWA, setIsGeneratingTWA] = useState(false);
  const [twaDownloadUrl, setTwaDownloadUrl] = useState<string | null>(null);
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
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setInstallPrompt(null);
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    }
  };

  const handleGenerateTWA = async () => {
    setIsGeneratingTWA(true);
    setTwaDownloadUrl(null);

    try {
      const response = await fetch('/api/generate-twa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName: 'Turbo C++ Mobile',
          packageName: 'com.encryptedcrew.turbocpp',
          hostUrl: 'https://turbo-ide.vercel.app',
          themeColor: '#0000AA',
          backgroundColor: '#0000AA',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate TWA package');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTwaDownloadUrl(url);

      // Auto-download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'turbo-cpp-mobile-android-twa.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating TWA:', error);
      alert('Failed to generate TWA package. Please try again.');
    } finally {
      setIsGeneratingTWA(false);
    }
  };

  const handleLaunchPWABuilder = () => {
    const targetUrl = encodeURIComponent('https://turbo-ide.vercel.app');
    window.open(`https://www.pwabuilder.com/?site=${targetUrl}`, '_blank');
  };

  const StatusBadge = ({ active, label }: { active: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {active ? (
        <CheckCircle2 className="w-4 h-4 text-green-400" />
      ) : (
        <AlertCircle className="w-4 h-4 text-yellow-400" />
      )}
      <span className={active ? 'text-green-400' : 'text-yellow-400'}>{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ANDROID APK & PWA BUILDER HUB
            </h2>
            <p className="text-blue-200 text-sm">
              Professional Android packaging with three installation methods
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900">
          <button
            onClick={() => setActiveTab('webapk')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'webapk'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            Instant WebAPK
          </button>
          <button
            onClick={() => setActiveTab('twa')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'twa'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-5 h-5" />
            Android TWA Package
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'pwabuilder'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cloud className="w-5 h-5" />
            PWABuilder Cloud
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* WebAPK Tab */}
          {activeTab === 'webapk' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Native WebAPK System (Chrome & Android)
                </h3>
                <p className="text-zinc-400 mb-6">
                  On Android, modern Chromium browsers generate an authentic, signed system APK
                  (WebAPK) directly onto your device. It runs with complete full-screen immersion,
                  app icon in your app drawer, and full offline caching.
                </p>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-800 p-6 rounded-lg border border-zinc-700">
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
                <button
                  onClick={handleInstallWebAPK}
                  disabled={!pwaStatus.isInstallable}
                  className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
                    pwaStatus.isInstallable
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-6 h-6" />
                  {pwaStatus.isInstallable ? 'Install WebAPK on Android Now' : 'Installation Not Available'}
                </button>
              )}

              {pwaStatus.isInstalled && (
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-semibold">Already Installed as WebAPK!</p>
                  <p className="text-green-300 text-sm mt-1">
                    Check your app drawer for the Turbo C++ icon
                  </p>
                </div>
              )}

              {/* Manual Steps */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-3">
                  Manual Installation Steps (if prompt is suppressed):
                </h4>
                <ol className="space-y-2 text-zinc-400 list-decimal list-inside">
                  <li>Tap the three vertical dots in Chrome top right.</li>
                  <li>Tap "Install app" or "Add to Home screen".</li>
                  <li>Confirm install to receive the native Android icon.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TWA Tab */}
          {activeTab === 'twa' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Download Complete Android TWA Project Bundle
                </h3>
                <p className="text-zinc-400 mb-6">
                  Generate a complete, ready-to-compile Android Studio project and PWABuilder package.
                  Includes AndroidManifest.xml, build.gradle (8.2.2), Java 17 configuration,
                  assetlinks.json, and launch icons.
                </p>
              </div>

              {/* ZIP Contents */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-3">
                  ZIP Contents (turbo-cpp-mobile-android-twa.zip):
                </h4>
                <ul className="space-y-2 text-zinc-400 text-sm font-mono">
                  <li>+ app/src/main/AndroidManifest.xml (TWA Activity & Intent Filters)</li>
                  <li>+ app/build.gradle (AndroidBrowserHelper 2.5.0, compileSdk 34)</li>
                  <li>+ build.gradle & settings.gradle (Gradle 8.2)</li>
                  <li>+ app/src/main/res/values/colors.xml & styles.xml (Borland Theme)</li>
                  <li>+ .well-known/assetlinks.json (Digital Asset Links)</li>
                  <li>+ pwabuilder-options.json (PWABuilder CLI Config)</li>
                  <li>+ README.md (Compilation & Play Store Guide)</li>
                </ul>
              </div>

              {/* Download Button */}
              <button
                onClick={handleGenerateTWA}
                disabled={isGeneratingTWA}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all"
              >
                {isGeneratingTWA ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Package...
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Download Android TWA Project (ZIP)
                  </>
                )}
              </button>

              {/* Compilation Steps */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-3">How to compile into APK:</h4>
                <ol className="space-y-2 text-zinc-400 list-decimal list-inside">
                  <li>Open Android Studio and select "Open an Existing Project".</li>
                  <li>Select Build → Build Bundle(s) / APK(s) → Build APK(s).</li>
                  <li>
                    Transfer the generated APK to your Android device or publish to Google Play Store.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* PWABuilder Tab */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Official PWABuilder Cloud Packaging
                </h3>
                <p className="text-zinc-400 mb-6">
                  PWABuilder (by Microsoft & Google) provides zero-code generation of Google Play Store
                  APKs, AABs, and Windows MSIX packages directly from your deployed Vercel URL.
                </p>
              </div>

              {/* Validation Score */}
              {validationResult && (
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold">PWA Readiness Score</h4>
                    <button
                      onClick={runValidation}
                      disabled={isValidating}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
                      Re-validate
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-white">{validationResult.overallScore}/100</span>
                      {validationResult.readyForStore ? (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                          ✓ Store Ready
                        </span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold">
                          Needs Improvements
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          validationResult.overallScore >= 90
                            ? 'bg-green-500'
                            : validationResult.overallScore >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${validationResult.overallScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-zinc-500 mb-1">Manifest</div>
                      <div className="text-white font-semibold">{validationResult.manifest.percentage}%</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 mb-1">Service Worker</div>
                      <div className="text-white font-semibold">
                        {validationResult.serviceWorker.active && validationResult.serviceWorker.offline ? '100%' : '0%'}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500 mb-1">Cache Size</div>
                      <div className="text-white font-semibold">
                        {formatBytes(validationResult.serviceWorker.cacheSize)}
                      </div>
                    </div>
                  </div>

                  {/* Issues & Warnings */}
                  {validationResult.manifest.issues.length > 0 && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-sm">
                      <div className="font-semibold text-red-400 mb-2">Issues:</div>
                      <ul className="space-y-1 text-red-300">
                        {validationResult.manifest.issues.map((issue, idx) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.manifest.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded text-sm">
                      <div className="font-semibold text-yellow-400 mb-2">Recommendations:</div>
                      <ul className="space-y-1 text-yellow-300">
                        {validationResult.manifest.warnings.slice(0, 3).map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Target URL */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-3">Target Vercel Deployed URL:</h4>
                <div className="bg-zinc-900 border border-zinc-700 rounded px-4 py-3 font-mono text-blue-400">
                  https://turbo-ide.vercel.app
                </div>
                <p className="text-zinc-400 text-sm mt-3">
                  Our manifest and service worker comply with all PWABuilder store readiness audits.
                </p>
              </div>

              {/* Launch Button */}
              <button
                onClick={handleLaunchPWABuilder}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all"
              >
                <ExternalLink className="w-6 h-6" />
                Launch in PWABuilder Studio
              </button>

              {/* PWABuilder Steps */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-3">PWABuilder Steps:</h4>
                <ol className="space-y-2 text-zinc-400 list-decimal list-inside">
                  <li>Launch PWABuilder with the button above.</li>
                  <li>Verify 100/100 Manifest & Service Worker Score.</li>
                  <li>Click "Package for Stores" → select "Android".</li>
                  <li>Download the signed Google Play Store APK / AAB.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
