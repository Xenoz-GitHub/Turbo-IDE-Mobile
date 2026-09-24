/**
 * Dedicated Credits Modal
 * Officially displaying:
 * - ENCRYPTED CREW cyber banner
 * - Borland Turbo C++ App Icon
 * - Developed by Suarez J. (XenozExe with running rainbow animation)
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React from 'react';
import { Shield, X } from 'lucide-react';
import { EncryptedCrewLogo } from './EncryptedCrewLogo';
import { AppIcon } from './AppIcon';

interface CreditsModalProps {
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <AppIcon size={20} />
            <h2 className="font-bold text-white text-sm font-dos">Turbo C++ Mobile - Credits</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Official ENCRYPTED CREW Banner (No white background) */}
          <EncryptedCrewLogo className="w-full" />

          {/* Developer credit with vibrant rainbow running animation on XenozExe */}
          <div className="pt-1">
            <div className="text-sm font-semibold text-zinc-300">
              Developed by Suarez J. (
              <span className="text-rainbow-running font-extrabold text-base tracking-wider">
                XenozExe
              </span>
              )
            </div>
          </div>

          <div className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-400 leading-relaxed text-left space-y-2">
            <div className="flex items-center gap-2 text-zinc-200 font-bold">
              <Shield size={14} className="text-emerald-400" />
              <span>Turbo C++ Mobile Production Shell</span>
            </div>
            <p>
              Engineered specifically for mobile touchscreen devices, faithfully executing 16-bit Borland Turbo C++ 3.0 C/C++ source code with conio.h, graphics.h, dos.h, iostream.h, and low-latency audio synthesis.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Core: Turbo C++ 3.0 (DOS)</span>
              <span>Platform: Mobile Web & Touch</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            Close Credits
          </button>
        </div>
      </div>
    </div>
  );
};
