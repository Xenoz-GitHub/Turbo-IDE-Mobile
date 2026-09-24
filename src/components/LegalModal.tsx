/**
 * Legal & Licensing Documentation Modal
 * Displays legal credits, DOSBox GPL-2.0 notices, Borland Turbo C++ licensing,
 * and official Encrypted Crew credits.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React from 'react';
import { X, ShieldCheck, Scale, FileText, ExternalLink } from 'lucide-react';
import { AppIcon } from './AppIcon';

interface LegalModalProps {
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <AppIcon size={20} />
            <div className="flex items-center gap-1.5">
              <Scale size={16} className="text-amber-400" />
              <h2 className="font-bold text-white text-sm font-dos">Legal & Documentation</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-zinc-300 font-sans leading-relaxed">
          {/* Section 1: Project Ownership & Credits */}
          <div className="p-3.5 bg-zinc-950/80 border border-teal-500/30 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
              <ShieldCheck size={16} />
              <span>Project Credits & Authorship</span>
            </div>
            <p className="text-zinc-300 text-xs">
              <strong>Credits: ENCRYPTED CREW</strong>
            </p>
            <p className="text-zinc-400 text-xs">
              Developed by <strong>Suarez J. (XenozExe)</strong>. Engineered for mobile touchscreens, providing low-latency synthesis, interactive C/C++ compilation, and authentic 16-bit DOS runtime emulation.
            </p>
          </div>

          {/* Section 2: DOSBox Core (GPL-2.0) */}
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Scale size={16} />
              <span>1. DOSBox Core (GPL-2.0)</span>
            </div>
            <p className="text-zinc-400 text-xs">
              The emulator core is derived from DOSBox and DOSBox-X under the{' '}
              <span className="text-white font-semibold">GNU General Public License v2.0 (GPL-2.0)</span>.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
              <li>Full source code availability is provided in adherence with GPL Section 3.</li>
              <li>Emulation pipelines and virtual DOS environment operate strictly on client-side sandboxes.</li>
            </ul>
          </div>

          {/* Section 3: Borland Turbo C++ 3.0 Binaries */}
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <FileText size={16} />
              <span>2. Borland Turbo C++ 3.0 Binaries</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
              <li>
                Borland Turbo C++ 3.0 is proprietary software of{' '}
                <span className="text-white">Embarcadero Technologies / Borland Software Corporation</span>.
              </li>
              <li>Turbo C++ Mobile is designed as an open host emulator shell.</li>
              <li>
                By default (<code className="text-amber-300">BUNDLED_TC=false</code>), users supply their own legal copy of Turbo C++ via the file manager or import step.
              </li>
              <li>No reverse engineering or unauthorized decompilation of Borland proprietary binaries is performed.</li>
            </ul>
          </div>

          {/* Section 4: Privacy & Client-Side Execution */}
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1">
            <h3 className="font-bold text-zinc-200 text-xs">3. Privacy & Device Data</h3>
            <p className="text-zinc-400 text-[11px]">
              All source code, compiled binaries, and user files created inside <code className="text-cyan-300">D:\</code> remain 100% on your local device storage. No source code or telemetry is transmitted to external servers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
