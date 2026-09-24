/**
 * In-App Browser Notice Component
 * Alerts users viewing the app in Instagram, Facebook, etc. browsers
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React from 'react';
import { AlertCircle, ExternalLink, X } from 'lucide-react';

interface InAppBrowserNoticeProps {
  browserName: string;
  instructions: string[];
  onOpenInBrowser: () => void;
  onDismiss: () => void;
}

export function InAppBrowserNotice({
  browserName,
  instructions,
  onOpenInBrowser,
  onDismiss,
}: InAppBrowserNoticeProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-amber-900/95 to-orange-900/95 border-2 border-amber-500/60 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-white text-sm">Browser Limitation</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-black/30 text-amber-300 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="text-amber-100 text-sm leading-relaxed">
            You're viewing this in <strong className="text-white">{browserName}</strong>'s in-app browser,
            which doesn't support installing apps to your home screen.
          </div>

          <div className="bg-black/30 border border-amber-500/30 rounded-lg p-3 space-y-2">
            <div className="text-xs font-semibold text-amber-200">
              To install Turbo C++ Mobile:
            </div>
            <ol className="text-xs text-amber-100 space-y-1.5 pl-4 list-decimal">
              {instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          <div className="text-xs text-amber-200/80 italic">
            For the best experience, always open web apps in Safari on iOS.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/20 border-t border-amber-500/20 flex items-center gap-2">
          <button
            onClick={onOpenInBrowser}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Safari</span>
          </button>
          <button
            onClick={onDismiss}
            className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
