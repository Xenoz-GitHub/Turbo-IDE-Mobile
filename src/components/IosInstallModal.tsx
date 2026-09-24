/**
 * iOS Safari Add-to-Home-Screen Interactive Modal
 * Provides visual step-by-step guidance and native Web Share API trigger for iOS users.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 * Strictly zero emojis.
 */

import React, { useState } from 'react';
import {
  X,
  Share2,
  PlusSquare,
  Compass,
  CheckCircle2,
  Copy,
  ExternalLink,
  Code2
} from 'lucide-react';
import { 
  triggerIOSShare, 
  getIOSShareInstructions,
  detectIOSDevice 
} from '../utils/iosPwaHelper';

interface IosInstallModalProps {
  onClose: () => void;
  onLaunchIde: () => void;
}

export function IosInstallModal({ onClose, onLaunchIde }: IosInstallModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const deviceInfo = detectIOSDevice();
  const instructions = getIOSShareInstructions();

  const handleNativeShare = async () => {
    setShareError(null);
    
    const success = await triggerIOSShare();
    
    if (!success) {
      setShareError('Share sheet not available. Please use Safari Share button manually.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareError('Unable to copy automatically. Please copy the URL from the browser bar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border-2 border-cyan-500/60 rounded-xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#000088] to-[#0000AA] px-4 py-3 border-b border-cyan-500/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="font-bold text-white tracking-wider text-sm sm:text-base">
              IOS SAFARI INSTALLATION GUIDE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-black/40 text-cyan-300 hover:text-white hover:bg-black/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-300">
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg">
            <p className="text-cyan-200 leading-relaxed">
              Install <strong className="text-white">Turbo C++ Mobile</strong> directly to your iPhone or iPad home screen for an authentic, full-screen standalone coding experience with offline access.
            </p>
          </div>

          {/* Interactive Step-by-Step Flow */}
          <div className="space-y-3">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-zinc-800/80 rounded-lg border border-zinc-700/60">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/50">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-zinc-300 text-xs mt-1">{instruction}</p>
                </div>
              </div>
            ))}
          </div>

          {deviceInfo.isStandalone && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>App is already installed and running in standalone mode!</span>
              </p>
            </div>
          )}

          {shareError && (
            <div className="p-2 bg-rose-950/60 border border-rose-500/50 rounded text-rose-300 text-xs">
              {shareError}
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={handleNativeShare}
            className="w-full sm:flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-black font-bold rounded flex items-center justify-center space-x-2 transition-colors cursor-pointer text-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Open iOS Share Sheet</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-xs"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied' : 'Copy URL'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onLaunchIde();
            }}
            className="w-full sm:w-auto py-2.5 px-3 bg-[#0000AA] hover:bg-[#0000CC] text-white rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-xs font-semibold"
          >
            <Code2 className="w-4 h-4 text-cyan-300" />
            <span>Launch Web IDE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
