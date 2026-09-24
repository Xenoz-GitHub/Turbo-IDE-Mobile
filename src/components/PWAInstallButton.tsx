import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';
import { hapticService } from '../utils/hapticService';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'header' | 'hero';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    hapticService.trigger('primary');
    await install();
  };

  const handleOpenIOSGuide = () => {
    hapticService.trigger('navigation');
    setShowIOSGuide(true);
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs border border-blue-400/40 transition cursor-pointer shrink-0 ${className}`}
          title="Install Turbo C++ as native app"
        >
          <Download size={13} className="text-blue-100" />
          <span>Install App</span>
        </button>
      );
    }

    if (variant === 'hero') {
      return (
        <button
          onClick={handleInstallClick}
          className={`flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 border border-blue-400/50 transition cursor-pointer active:scale-98 ${className}`}
        >
          <Download size={18} />
          <span>Install Turbo C++ App</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition cursor-pointer ${className}`}
      >
        <Download size={13} />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        {variant === 'header' ? (
          <button
            onClick={handleOpenIOSGuide}
            className={`flex items-center gap-1.5 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded-lg text-xs font-medium border border-cyan-800/50 transition cursor-pointer shrink-0 ${className}`}
            title="Install Turbo C++ on iPhone/iPad"
          >
            <Smartphone size={13} className="text-cyan-400" />
            <span>Install on iOS</span>
          </button>
        ) : (
          <button
            onClick={handleOpenIOSGuide}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-cyan-300 rounded-lg text-xs font-medium border border-zinc-700 transition cursor-pointer ${className}`}
          >
            <Smartphone size={13} />
            <span>Install on iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-750 p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-cyan-400" size={18} />
                  <h3 className="font-bold text-sm">Install Turbo C++ on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    Tap the <strong className="text-white inline-flex items-center gap-1">Share <Share2 size={12} className="text-cyan-400 inline" /></strong> button in Safari's bottom toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    Scroll down and select <strong className="text-white inline-flex items-center gap-1">Add to Home Screen <PlusSquare size={12} className="text-cyan-400 inline" /></strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    Launch <strong className="text-white">Turbo C++</strong> directly from your Home Screen in full-screen standalone mode.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold border border-zinc-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
