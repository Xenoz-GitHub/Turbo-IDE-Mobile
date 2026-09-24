/**
 * First-Run Wizard for Turbo C++ Mobile
 * Guides users through environment setup, workspace choice, and keyboard controls.
 * Credits: ENCRYPTED CREW
 */

import React, { useState } from 'react';
import { ShieldCheck, HardDrive, Keyboard, ArrowRight, Check } from 'lucide-react';

interface FirstRunWizardProps {
  onComplete: () => void;
}

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [useBundled, setUseBundled] = useState(true);
  const [workspaceMode, setWorkspaceMode] = useState<'app-private' | 'saf-linked'>('app-private');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-white">Turbo C++ Mobile v1.0</h1>
          <p className="text-xs text-zinc-400">Production-quality DOSBox Borland C++ Environment</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-blue-500' : s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: TC Installation Mode */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <ShieldCheck size={18} />
              <span>Step 1: Turbo C++ 3.0 Environment</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Turbo C++ Mobile runs the original unmodified Borland 16-bit binaries. Choose how the C:\TC system is provisioned:
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setUseBundled(true)}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  useBundled ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                }`}
              >
                <input type="radio" checked={useBundled} onChange={() => setUseBundled(true)} className="mt-1 accent-blue-500" />
                <div>
                  <div className="font-bold text-xs">Standard Pre-Configured C:\TC (Recommended)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Pre-mounts INCLUDE, LIB, and BGI drivers (EGAVGA.BGI) for instant zero-config compiling.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setUseBundled(false)}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  !useBundled ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                }`}
              >
                <input type="radio" checked={!useBundled} onChange={() => setUseBundled(false)} className="mt-1 accent-blue-500" />
                <div>
                  <div className="font-bold text-xs">Import Custom Turbo C++ ZIP / Folder</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Validates TC.EXE, INCLUDE, LIB, and copies into sandboxed app storage.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Storage Workspace */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <HardDrive size={18} />
              <span>Step 2: Virtual Workspace (D:\)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your source code is safely kept on D:\ with automatic 8.3 filename mapping and byte-identical CRLF preservation:
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setWorkspaceMode('app-private')}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  workspaceMode === 'app-private' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                }`}
              >
                <input type="radio" checked={workspaceMode === 'app-private'} onChange={() => setWorkspaceMode('app-private')} className="mt-1 accent-blue-500" />
                <div>
                  <div className="font-bold text-xs">App-Private Workspace (Zero Permissions)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Requires no system permissions. Fast, sandboxed, and exportable at any time.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setWorkspaceMode('saf-linked')}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  workspaceMode === 'saf-linked' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                }`}
              >
                <input type="radio" checked={workspaceMode === 'saf-linked'} onChange={() => setWorkspaceMode('saf-linked')} className="mt-1 accent-blue-500" />
                <div>
                  <div className="font-bold text-xs">Link External Folder (SAF / Files App)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Syncs projects between mobile filesystem and Turbo C++ with 2-way conflict prevention.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Touch Keyboard & Mobile Workflow Tips */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Keyboard size={18} />
              <span>Step 3: Mobile Touch & Coding Controls</span>
            </div>
            <div className="p-3 bg-zinc-850 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">Run Button:</span>
                <span className="text-zinc-300">Execute code directly from menu or footer</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">Compile Button:</span>
                <span className="text-zinc-300">Check syntax & verify your C++ code</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400">Save & Open:</span>
                <span className="text-zinc-300">Fast file management on mobile storage</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400">Break Button:</span>
                <span className="text-zinc-300">Safely stop running programs & loops</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-400">Orientation:</span>
                <span className="text-zinc-300">Rotate device anytime for Portrait or Landscape</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs font-semibold"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Check size={14} />
              <span>Launch Turbo C++ IDE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
