/**
 * iOS Install Banner Component
 * Smart banner prompting iOS users to add app to home screen
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React from 'react';
import { X, Share2, Plus, ChevronRight } from 'lucide-react';
import { AppIcon } from './AppIcon';

interface IosInstallBannerProps {
  onOpenGuide: () => void;
  onDismiss: () => void;
}

export function IosInstallBanner({ onOpenGuide, onDismiss }: IosInstallBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-[#0000AA] via-[#0000CC] to-[#0000AA] border-b-2 border-cyan-400/60 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: App Icon & Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <AppIcon size={40} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-white font-bold text-sm truncate">
                Turbo C++ Mobile
              </div>
              <div className="text-cyan-200 text-xs truncate">
                Install for full-screen experience
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenGuide}
              className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold rounded-lg flex items-center space-x-1.5 transition-colors text-xs shadow-lg"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={onDismiss}
              className="p-2 rounded-lg hover:bg-white/10 text-cyan-300 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Hint */}
        <div className="bg-black/20 border-t border-cyan-400/20 px-4 py-2 flex items-center justify-center space-x-2 text-xs text-cyan-100">
          <Share2 className="w-3.5 h-3.5 text-cyan-300" />
          <span>Tap Share, then</span>
          <Plus className="w-3.5 h-3.5 text-cyan-300" />
          <span>"Add to Home Screen"</span>
        </div>
      </div>
    </div>
  );
}
