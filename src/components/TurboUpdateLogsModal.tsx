/**
 * Authentic Borland Turbo C++ 3.0 Update Logs Modal
 * Displays simple, structured patch notes and update history.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React from 'react';
import { hapticService } from '../utils/hapticService';
import { Sparkles, CheckCircle2, History, X } from 'lucide-react';

interface UpdateLogEntry {
  version: string;
  date: string;
  badge?: string;
  highlights: string[];
}

const UPDATE_LOGS: UpdateLogEntry[] = [
  {
    version: 'v3.0.4',
    date: 'September 2026',
    badge: 'Latest Update',
    highlights: [
      'Keyboard: Smooth horizontal scrolling for quick C++ symbols and snippets strip.',
      'Keyboard: Long-press continuous deletion support on Backspace key.',
      'Direct Mobile File Manager: Tap "Open" or F3 to browse and load workspace files instantly.',
      'Message Window: High-contrast visible 2=[↑] zoom button & explicit Close Message control.',
      'Menu UI: Resolved mobile menu cuts ("Project" clipping) and zoom button overlaps.',
      'Custom Scrollbars: Styled retro Borland cyan scrollbars across IDE and settings modals.'
    ]
  },
  {
    version: 'v3.0.3',
    date: 'September 2026',
    highlights: [
      'Compiler: Semantic analysis & symbol validation for undefined functions, variables & stream typos.',
      'Workflow: Run button is compilation-gated (requires clean compilation before executing).',
      'Output Screen: Full-bleed DOS terminal buffer with authentic CRT scanline shader.'
    ]
  },
  {
    version: 'v3.0.2',
    date: 'September 2026',
    highlights: [
      'Mobile Input: Dedicated 4-way arrow keys (Left, Right, Up, Down) for smooth caret navigation.',
      'Audio: Authentic PC Speaker sound synthesizer with clicks and compilation chimes.',
      'Dual Drives: Support for virtual C: (System Headers) and D: (User Workspace) storage.'
    ]
  },
  {
    version: 'v3.0.1',
    date: 'Initial Release',
    highlights: [
      'Borland Turbo C++ 3.0 Mobile IDE recreation with 80x25 text-mode emulation.',
      'BGI Graphics Library support (initgraph, circle, line, rectangle, setcolor).',
      'Project management, sample code library, and mobile file import/export.'
    ]
  }
];

interface TurboUpdateLogsModalProps {
  onClose: () => void;
}

export const TurboUpdateLogsModal: React.FC<TurboUpdateLogsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-[2px] select-none font-dos">
      <div className="w-[96%] max-w-[520px] bg-[#A8A8A8] border-2 border-white dos-shadow-lg text-black text-xs relative flex flex-col max-h-[85vh]">
        {/* Title Bar: ═[■]═════════ Update Logs ═════════ */}
        <div className="h-6 bg-[#A8A8A8] border-b border-black px-1 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={() => {
                hapticService.trigger('navigation');
                onClose();
              }}
              className="w-4 h-4 bg-[#A8A8A8] border border-black flex items-center justify-center hover:bg-zinc-300 active:bg-zinc-400 shrink-0 cursor-pointer"
              title="Close Dialog"
            >
              <span className="text-[#00AA00] font-black text-xs leading-none">■</span>
            </button>
            <span className="text-black tracking-wider truncate">═════════ Update Logs ═════════</span>
          </div>
          <button
            onClick={() => {
              hapticService.trigger('navigation');
              onClose();
            }}
            className="text-black hover:text-red-700 font-bold px-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Subheader */}
        <div className="bg-[#0000AA] text-white px-3 py-1.5 border-b border-black flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#FFFF55]" />
            <span className="font-bold text-xs tracking-wide">Borland Turbo C++ 3.0 Mobile</span>
          </div>
          <span className="text-[11px] text-cyan-300 font-mono">v3.0.4 Release</span>
        </div>

        {/* Modal Body: Scrollable Log Entries */}
        <div className="p-3 overflow-y-auto flex-1 dos-scrollbar flex flex-col gap-3 text-xs bg-[#A8A8A8]">
          {UPDATE_LOGS.map((log, index) => (
            <div
              key={log.version}
              className="bg-zinc-100 border border-black p-2.5 flex flex-col gap-1.5 shadow-xs"
            >
              {/* Version & Date Header */}
              <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0000AA] text-xs font-mono">{log.version}</span>
                  {log.badge && (
                    <span className="px-1.5 py-0.2 bg-[#00AA00] text-black font-bold text-[9px] rounded-xs uppercase tracking-tight">
                      {log.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-600">{log.date}</span>
              </div>

              {/* Highlights List */}
              <ul className="space-y-1 pt-0.5">
                {log.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-900 leading-snug">
                    <CheckCircle2 size={12} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Credits footer note */}
          <div className="bg-[#00AAAA] border border-black p-2 text-[#0000AA] font-mono text-[10px] text-center">
            ENCRYPTED CREW • Developed by Suarez J. (XenozExe)
          </div>
        </div>

        {/* Dialog Footer Actions */}
        <div className="p-2 bg-[#A8A8A8] border-t border-black flex items-center justify-between shrink-0">
          <span className="text-[10px] text-zinc-700 flex items-center gap-1">
            <History size={11} />
            <span>Updated: Sep 24, 2026</span>
          </span>
          <button
            onClick={() => {
              hapticService.trigger('primary');
              onClose();
            }}
            className="px-5 py-1 bg-[#00AA00] hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs border border-black dos-shadow-sm cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            [ OK ]
          </button>
        </div>
      </div>
    </div>
  );
};
