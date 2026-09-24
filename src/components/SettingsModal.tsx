/**
 * Native Settings & Diagnostics Modal
 * Emulation cycles, video scaling, audio, haptics, GPL-2.0 licenses, and diagnostics
 * Credits: ENCRYPTED CREW
 */

import React, { useState } from 'react';
import { EmulatorSettings, EmulatorLog } from '../types/emulator';
import {
  Sliders,
  Monitor,
  Volume2,
  Vibrate,
  Shield,
  FileText,
  RotateCcw,
  Download,
  X,
  ExternalLink
} from 'lucide-react';

interface SettingsModalProps {
  settings: EmulatorSettings;
  onUpdateSettings: (newSettings: Partial<EmulatorSettings>) => void;
  logs: EmulatorLog[];
  onResetTcConfig: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  logs,
  onResetTcConfig,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'emulator' | 'display' | 'input' | 'legal' | 'logs'>('emulator');

  const exportDiagnosticLog = () => {
    const text = logs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turboc_mobile_diag_${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 font-sans">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="text-cyan-400" size={18} />
            <h2 className="font-bold text-white text-base">Turbo C++ Mobile Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector with styled visible scrollbar */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-950/60 px-2 modal-tab-scrollbar text-xs font-semibold gap-1 py-1">
          {[
            { id: 'emulator', label: 'Emulator Core' },
            { id: 'display', label: 'Display & CRT' },
            { id: 'input', label: 'Keyboard & Input' },
            { id: 'logs', label: 'Diagnostics' },
            { id: 'legal', label: 'Legal & Licenses' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs dos-scrollbar">
          {/* TAB 1: EMULATOR */}
          {activeTab === 'emulator' && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-zinc-200 block mb-1">Emulated CPU Cycles</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Max (Auto)', val: 'max' },
                    { label: '30,000 (Fast)', val: 30000 },
                    { label: '15,000 (Standard)', val: 15000 }
                  ].map(item => (
                    <button
                      key={String(item.val)}
                      onClick={() => onUpdateSettings({ cycles: item.val as number | 'max' })}
                      className={`p-2 rounded border font-mono ${
                        settings.cycles === item.val
                          ? 'bg-blue-600 border-blue-500 text-white font-bold'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-200">PC Speaker & Sound Blaster</div>
                    <div className="text-[11px] text-zinc-400">Low-latency square wave emulation for dos.h sound()</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-200">Bundled Turbo C++ 3.0 Binaries</div>
                    <div className="text-[11px] text-zinc-400">Toggle bundled distribution (BUNDLED_TC flag)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bundledTc}
                    onChange={(e) => onUpdateSettings({ bundledTc: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (confirm('Reset TCCONFIG.TC and autoexec to factory defaults?')) {
                      onResetTcConfig();
                      alert('Turbo C++ configuration reset to C:\\TC defaults.');
                    }
                  }}
                  className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 rounded font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Reset TC Configuration (TCCONFIG.TC)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DISPLAY */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-zinc-200 block mb-1">Display Scaling Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '4:3', label: 'Aspect-Correct 4:3 (Classic CRT)', desc: 'Faithful retro aspect ratio' },
                    { id: 'integer', label: 'Integer Scaling (Crisp Pixel)', desc: '1:1 pixel grid, no blur' },
                    { id: 'fit', label: 'Fit to Viewport', desc: 'Maximizes size within safe area' },
                    { id: 'stretch', label: 'Stretch Full', desc: 'Fills entire container' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => onUpdateSettings({ videoScaling: mode.id as EmulatorSettings['videoScaling'] })}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        settings.videoScaling === mode.id
                          ? 'bg-blue-600/30 border-blue-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                      }`}
                    >
                      <div className="font-bold">{mode.label}</div>
                      <div className="text-[10px] text-zinc-400">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">CRT Scanline Simulation Filter</div>
                  <div className="text-[11px] text-zinc-400">Authentic 1990s cathode ray tube horizontal scanlines</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.crtScanlines}
                  onChange={(e) => onUpdateSettings({ crtScanlines: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: INPUT */}
          {activeTab === 'input' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Haptic Feedback on Touch</div>
                  <div className="text-[11px] text-zinc-400">Vibration pulse on key strikes and shortcuts</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.hapticEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    onUpdateSettings({ hapticEnabled: enabled });
                    if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate([25, 20, 25]);
                    }
                  }}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Keyboard Audio Clicks</div>
                  <div className="text-[11px] text-zinc-400">Audible tactile mechanical key click sound</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.clickSound}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    onUpdateSettings({ clickSound: enabled });
                  }}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Touch as Mouse / Trackpad Mode</div>
                  <div className="text-[11px] text-zinc-400">Enables visible DOS mouse pointer & drag tracking in IDE</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.trackpadMode}
                  onChange={(e) => onUpdateSettings({ trackpadMode: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Keyboard Height adjustment */}
              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-200 text-xs">
                    Keyboard Height: <span className="text-cyan-400 font-mono">{settings.keyboardHeight}px</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Compact', val: 230 },
                      { label: 'Standard', val: 280 },
                      { label: 'Tall', val: 340 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => onUpdateSettings({ keyboardHeight: preset.val })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          settings.keyboardHeight === preset.val
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="200"
                  max="380"
                  step="10"
                  value={settings.keyboardHeight}
                  onChange={(e) => onUpdateSettings({ keyboardHeight: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>200px (Max editor view)</span>
                  <span>280px (Default)</span>
                  <span>380px (Larger keys)</span>
                </div>
              </div>

              {/* Keyboard Opacity adjustment */}
              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-200 text-xs">
                    Keyboard Opacity: <span className="text-cyan-400 font-mono">{Math.round(settings.keyboardOpacity * 100)}%</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      { label: '50%', val: 0.5 },
                      { label: '80%', val: 0.8 },
                      { label: '100%', val: 1.0 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => onUpdateSettings({ keyboardOpacity: preset.val })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          Math.abs(settings.keyboardOpacity - preset.val) < 0.05
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={settings.keyboardOpacity}
                  onChange={(e) => onUpdateSettings({ keyboardOpacity: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>30% (See-through)</span>
                  <span>80% (Translucent)</span>
                  <span>100% (Solid)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200">Active System & Emulator Logs</span>
                <button
                  onClick={exportDiagnosticLog}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center gap-1 border border-zinc-700"
                >
                  <Download size={13} />
                  <span>Export Log</span>
                </button>
              </div>

              <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] max-h-56 overflow-y-auto space-y-1">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-zinc-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`shrink-0 font-bold ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-amber-400' :
                      log.level === 'dos' ? 'text-cyan-400' : 'text-zinc-400'
                    }`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-zinc-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LEGAL & LICENSES */}
          {activeTab === 'legal' && (
            <div className="space-y-3 text-zinc-300 leading-relaxed">
              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800">
                <h3 className="font-bold text-white text-sm mb-1">DOSBox Core Emulation</h3>
                <p className="text-[11px] text-zinc-400 mb-2">
                  Licensed under GNU General Public License v2.0 (GPL-2.0). Source code availability and modifications comply with Section 3 of the GPL.
                </p>
                <a
                  href="https://www.dosbox.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Visit DOSBox Project Source Repository</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800">
                <h3 className="font-bold text-white text-sm mb-1">Turbo C++ 3.0 Ownership</h3>
                <p className="text-[11px] text-zinc-400">
                  Borland Turbo C++ 3.0 is intellectual property of Embarcadero Technologies / Borland Software Corporation. Turbo C++ Mobile operates as an unmodified host shell around user-provided or educational binaries without reverse engineering or modification.
                </p>
              </div>

              <div className="p-3 bg-zinc-850 rounded-lg border border-zinc-800 text-center">
                <div className="text-xs text-zinc-400 mb-1">Official Project Information</div>
                <div className="text-zinc-200 text-xs font-semibold">
                  Tap the <span className="text-amber-400 font-bold">Credits</span> button in the top navigation bar to view full credits and authorship.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
