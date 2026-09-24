/**
 * iOS Update Prompt Component
 * Notifies iOS PWA users about available updates
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React from 'react';
import { RefreshCw, X, ExternalLink, Sparkles } from 'lucide-react';

interface IosUpdatePromptProps {
  version: string;
  changelog?: string[];
  onUpdate: () => void;
  onDismiss: () => void;
}

export function IosUpdatePrompt({ 
  version, 
  changelog = [], 
  onUpdate, 
  onDismiss 
}: IosUpdatePromptProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-br from-cyan-900/95 to-blue-900/95 backdrop-blur-md border-2 border-cyan-400/60 rounded-xl shadow-2xl overflow-hidden max-w-md mx-auto">
        {/* Header */}
        <div className="bg-cyan-950/80 border-b border-cyan-400/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <span className="font-bold text-white text-sm">Update Available</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-black/30 text-cyan-300 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-200 text-sm font-semibold">
              Version {version}
            </span>
            <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 rounded text-cyan-300 text-xs font-bold">
              NEW
            </span>
          </div>

          {changelog.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-300">What's new:</div>
              <ul className="space-y-1">
                {changelog.slice(0, 3).map((item, index) => (
                  <li key={index} className="text-xs text-zinc-300 flex items-start space-x-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3 space-y-2">
            <div className="text-xs font-semibold text-amber-200">
              How to update on iOS:
            </div>
            <ol className="text-xs text-amber-100/90 space-y-1 pl-4 list-decimal">
              <li>Close this app completely</li>
              <li>Open Safari and visit the website again</li>
              <li>Re-add to Home Screen to update</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/20 border-t border-cyan-400/20 flex items-center gap-2">
          <button
            onClick={onUpdate}
            className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Safari</span>
          </button>
          <button
            onClick={onDismiss}
            className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
