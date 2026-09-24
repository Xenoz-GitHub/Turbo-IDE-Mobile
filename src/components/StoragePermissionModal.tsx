/**
 * Authentic Borland DOS Style Mobile Storage Permission Dialog
 * Displays explicit user permission request before saving to mobile file manager / downloads.
 * Credits: ENCRYPTED CREW
 */

import React from 'react';
import { DosFile } from '../types/emulator';
import { HardDrive, Download, CheckCircle, XCircle } from 'lucide-react';
import { hapticService } from '../utils/hapticService';

interface StoragePermissionModalProps {
  file: DosFile;
  isAll?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StoragePermissionModal: React.FC<StoragePermissionModalProps> = ({
  file,
  isAll = false,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 font-dos select-none">
      <div className="w-full max-w-md bg-[#A8A8A8] border-2 border-white dos-shadow text-black flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0000AA] text-white px-2 py-1 flex items-center justify-between font-bold text-xs border-b border-white">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">■</span>
            <span>═ Save to Device File Manager ═</span>
          </div>
          <button
            onClick={() => {
              hapticService.trigger('navigation');
              onCancel();
            }}
            className="text-white hover:text-red-300 px-1 font-bold"
          >
            [X]
          </button>
        </div>

        {/* Body */}
        <div className="p-4 text-xs space-y-3">
          <div className="flex items-start gap-3 bg-white p-3 border border-black dos-shadow-sm">
            <HardDrive className="text-[#0000AA] shrink-0 mt-0.5" size={24} />
            <div className="space-y-1">
              <div className="font-bold text-sm text-black">
                {isAll ? 'Export All Project Files to Phone' : `Save '${file.dosName}' to Phone`}
              </div>
              <p className="text-zinc-700 leading-normal">
                Turbo C++ Mobile requires your permission to write source code directly to your phone's native storage (e.g. <b>Downloads / Files</b> folder).
              </p>
            </div>
          </div>

          <div className="bg-[#0000AA] text-white p-2.5 space-y-1 font-mono text-[11px] border border-black">
            <div className="flex justify-between">
              <span className="text-[#55FFFF]">Target File:</span>
              <span className="text-[#FFFF55] font-bold">{isAll ? 'ALL WORKSPACE FILES' : file.hostName || file.dosName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#55FFFF]">Device Location:</span>
              <span className="text-white">Device Downloads / Files</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#55FFFF]">Size:</span>
              <span className="text-white">{isAll ? 'Full Workspace' : `${file.sizeBytes} bytes`}</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-800">
            Once granted, the file will be immediately available in your mobile file manager for easy sharing, backup, or inspection.
          </p>
        </div>

        {/* Actions */}
        <div className="p-3 bg-[#A8A8A8] border-t border-black flex justify-end gap-2">
          <button
            onClick={() => {
              hapticService.trigger('navigation');
              onCancel();
            }}
            className="px-3 py-1.5 bg-[#A8A8A8] hover:bg-zinc-300 text-black border border-black font-bold text-xs flex items-center gap-1"
          >
            <XCircle size={14} />
            Cancel
          </button>
          <button
            onClick={() => {
              hapticService.trigger('action');
              onConfirm();
            }}
            className="px-4 py-1.5 bg-[#00AA00] hover:bg-emerald-400 text-black border border-black font-bold text-xs flex items-center gap-1.5 dos-shadow-sm active:translate-y-0.5"
          >
            <Download size={14} />
            Allow & Save to Phone
          </button>
        </div>
      </div>
    </div>
  );
};
