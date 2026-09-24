/**
 * Authentic Borland Turbo C++ 3.0 File Dialog Box
 * Meticulously modeled after User Reference Images:
 * - Image 1: "Save File As" Dialog
 * - Image 2: "Open Project File" Dialog
 * - Image 9: "Open a File" Dialog
 * 
 * Features:
 * - Double border frame with title and close box [■]
 * - Yellow field labels ("Save File As" / "Open Project File" / "Name", and "Files")
 * - Dark blue input field with blinking cursor and dropdown arrow [↓]
 * - Cyan two-column files listbox with interactive horizontal scrollbar (◄ ▓▓▓ ►)
 * - Green 3D action buttons: [ OK ] / [ Open ], [ Replace ], [ Cancel ], [ Help ] with solid black drop shadows
 * - Dark blue file details status pane at the bottom
 * - Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React, { useState } from 'react';
import { DosFile } from '../types/emulator';
import { SAMPLE_PROGRAMS } from '../data/samplePrograms';
import { hapticService } from '../utils/hapticService';

export type FileDialogMode = 'open' | 'save_as' | 'open_project';

interface TurboOpenFileDialogProps {
  files: DosFile[];
  activeFileId: string;
  mode?: FileDialogMode;
  onSelectFile: (file: DosFile) => void;
  onSaveAs?: (fileName: string) => void;
  onClose: () => void;
  onHelp?: () => void;
  onOpenFileManager?: () => void;
}

export const TurboOpenFileDialog: React.FC<TurboOpenFileDialogProps> = ({
  files,
  activeFileId,
  mode = 'open',
  onSelectFile,
  onSaveAs,
  onClose,
  onHelp,
  onOpenFileManager
}) => {
  const displayFiles = files && files.length > 0 ? files : SAMPLE_PROGRAMS;
  const [selectedFileId, setSelectedFileId] = useState<string>(activeFileId || displayFiles[0]?.id || '');
  const selectedFile = displayFiles.find(f => f.id === selectedFileId) || displayFiles[0];

  const defaultInputName = mode === 'save_as'
    ? (selectedFile?.dosName || 'NONAME00.CPP')
    : mode === 'open_project'
    ? '*.PRJ'
    : (selectedFile?.dosName || '*.C;*.CPP');

  const [inputFileName, setInputFileName] = useState<string>(defaultInputName);
  const [scrollOffset, setScrollOffset] = useState<number>(0);

  const titleText = mode === 'save_as'
    ? '═════════ Save File As ═════════'
    : mode === 'open_project'
    ? '═════════ Open Project File ═════════'
    : '═════════ Open a File ═════════';

  const labelText = mode === 'save_as'
    ? 'Save File As'
    : mode === 'open_project'
    ? 'Open Project File'
    : 'Name';

  const primaryBtnText = mode === 'open' ? '[ Open ]' : '[  OK  ]';

  const handleConfirm = () => {
    hapticService.trigger('primary');
    if (mode === 'save_as') {
      if (onSaveAs) {
        onSaveAs(inputFileName);
      } else if (selectedFile) {
        onSelectFile(selectedFile);
      }
    } else if (mode === 'open_project') {
      if (selectedFile) onSelectFile(selectedFile);
    } else {
      if (selectedFile) onSelectFile(selectedFile);
    }
    onClose();
  };

  const formattedDate = new Date(selectedFile?.lastModified || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(selectedFile?.lastModified || Date.now()).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-[1px] select-none font-dos">
      {/* Dialog Container with authentic DOS double border and solid black drop shadow */}
      <div className="w-[94%] max-w-[500px] bg-[#A8A8A8] border-2 border-white dos-shadow-lg text-black text-xs relative flex flex-col">
        {/* Title Bar: ═[■]═════════ Save File As / Open a File ═════════ */}
        <div className="h-6 bg-[#A8A8A8] border-b border-black px-1 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-1.5 w-full">
            {/* Close Button [■] with green square */}
            <button
              onClick={() => {
                hapticService.trigger('navigation');
                onClose();
              }}
              className="w-4 h-4 bg-[#A8A8A8] border border-black flex items-center justify-center hover:bg-zinc-300 active:bg-zinc-400 shrink-0"
              title="Close Dialog"
            >
              <span className="text-[#00AA00] font-black text-xs leading-none">■</span>
            </button>
            <span className="text-black tracking-wide truncate">{titleText}</span>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="p-3 flex flex-col gap-2.5">
          {/* Top Row: Label and Input */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[#555500] font-bold text-xs uppercase tracking-wider">
              {labelText}
            </label>
            <div className="flex items-center">
              <div className="flex-1 h-6 bg-[#0000AA] border border-black px-2 flex items-center text-white font-mono text-xs overflow-hidden">
                <input
                  type="text"
                  value={mode === 'save_as' ? inputFileName : `C:\\TURBOC3\\BIN\\${inputFileName}`}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^C:\\TURBOC3\\BIN\\/i, '');
                    setInputFileName(val);
                  }}
                  className="bg-transparent border-none text-white font-mono text-xs w-full focus:outline-none"
                />
                <span className="inline-block w-1.5 h-3 bg-white ml-0.5 animate-pulse shrink-0" />
              </div>
              {mode === 'open' && (
                <button
                  onClick={() => hapticService.trigger('action')}
                  className="h-6 px-1.5 bg-[#00AA00] border border-black text-black font-bold flex items-center justify-center hover:bg-emerald-500 shrink-0"
                >
                  [↓]
                </button>
              )}
            </div>
          </div>

          {/* Middle Row: Files Listbox and Action Buttons */}
          <div className="flex gap-3">
            {/* Left: Files column */}
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex justify-between items-center">
                <span className="text-[#555500] font-bold text-xs uppercase tracking-wider">
                  Files
                </span>
                <span className="text-[10px] text-zinc-700">D:\TURBOC3\BIN</span>
              </div>

              {/* Cyan listbox box: 2-column list of files/directories (Image 1 & 2) */}
              <div className="h-44 bg-[#00AAAA] border border-black text-[#0000AA] overflow-y-auto dos-scrollbar p-1 flex flex-col justify-between select-none">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-xs">
                  {/* Built-in DOS Directory entries (Image 1 & 2) */}
                  <div
                    onClick={() => {
                      hapticService.trigger('action');
                      setInputFileName(mode === 'open_project' ? '*.PRJ' : '*.CPP');
                    }}
                    className="text-black font-bold px-1 hover:bg-[#0000AA] hover:text-white cursor-pointer truncate"
                  >
                    PROJECT\
                  </div>
                  <div
                    onClick={() => {
                      hapticService.trigger('action');
                      setInputFileName('..\\*.CPP');
                    }}
                    className="text-black font-bold px-1 hover:bg-[#0000AA] hover:text-white cursor-pointer truncate"
                  >
                    ..\
                  </div>

                  {/* Dynamic Files in Workspace */}
                  {displayFiles.map((file) => {
                    const isSelected = file.id === selectedFileId;
                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          hapticService.trigger('action');
                          setSelectedFileId(file.id);
                          setInputFileName(file.dosName);
                        }}
                        onDoubleClick={handleConfirm}
                        className={`px-1 cursor-pointer font-bold truncate transition-colors ${
                          isSelected
                            ? 'bg-[#0000AA] text-[#FFFF55]'
                            : 'text-black hover:bg-[#0000AA] hover:text-white'
                        }`}
                        title={`${file.dosName} (${file.sizeBytes} bytes)`}
                      >
                        {file.dosName}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom horizontal scrollbar inside listbox (Image 1, 2, 9) */}
                <div className="h-3.5 bg-[#00AAAA] border-t border-[#0000AA] flex items-center justify-between mt-1 text-[9px] text-[#0000AA] font-bold">
                  <button
                    onClick={() => {
                      hapticService.trigger('navigation');
                      setScrollOffset(prev => Math.max(0, prev - 1));
                    }}
                    className="px-1 hover:bg-teal-300 cursor-pointer"
                  >
                    ◄
                  </button>
                  <div className="flex-1 mx-1 h-2 bg-[#0000AA]/30 relative">
                    <div
                      style={{ left: `${scrollOffset * 20}%` }}
                      className="w-6 h-full bg-[#0000AA] absolute"
                    />
                  </div>
                  <button
                    onClick={() => {
                      hapticService.trigger('navigation');
                      setScrollOffset(prev => Math.min(4, prev + 1));
                    }}
                    className="px-1 hover:bg-teal-300 cursor-pointer"
                  >
                    ►
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons Column (Matching Image 1, 2, & 9) */}
            <div className="w-28 flex flex-col gap-1.5 pt-2">
              {/* Primary Confirm Button: [ OK ] or [ Open ] */}
              <button
                onClick={handleConfirm}
                className="w-full py-1 bg-[#00AA00] hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs border border-black dos-shadow-sm flex items-center justify-center transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                {primaryBtnText}
              </button>

              {/* [ File Manager ] Direct Mobile Button */}
              {onOpenFileManager && (
                <button
                  onClick={() => {
                    hapticService.trigger('primary');
                    onClose();
                    onOpenFileManager();
                  }}
                  className="w-full py-1 bg-[#0055AA] hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-xs border border-black dos-shadow-sm flex items-center justify-center transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  title="Direct to Mobile File Manager"
                >
                  [ File Mgr ]
                </button>
              )}

              {/* [ Replace ] Button (Only in Open mode) */}
              {mode === 'open' && (
                <button
                  disabled
                  className="w-full py-1 bg-[#888888] text-[#555555] font-bold text-xs border border-[#555555] cursor-not-allowed flex items-center justify-center"
                >
                  [ Replace ]
                </button>
              )}

              {/* [ Cancel ] Button (Green 3D with drop shadow) */}
              <button
                onClick={() => {
                  hapticService.trigger('navigation');
                  onClose();
                }}
                className="w-full py-1 bg-[#00AA00] hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs border border-black dos-shadow-sm flex items-center justify-center transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                [ Cancel ]
              </button>

              {/* [ Help ] Button (Green 3D with drop shadow) */}
              <button
                onClick={() => {
                  hapticService.trigger('primary');
                  if (onHelp) {
                    onHelp();
                  } else {
                    alert(`${titleText}: Select file or enter name and tap ${primaryBtnText}.`);
                  }
                }}
                className="w-full py-1 bg-[#00AA00] hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs border border-black dos-shadow-sm flex items-center justify-center transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                [ Help ]
              </button>
            </div>
          </div>

          {/* Bottom Row: Dark Blue File Info Status Pane (Image 1 & 2) */}
          <div className="bg-[#0000AA] border border-black p-1.5 text-cyan-300 font-mono text-[11px] flex flex-col gap-0.5">
            <div className="truncate text-white">
              C:\TURBOC3\BIN\{mode === 'open_project' ? '*.PRJ' : (selectedFile ? selectedFile.dosName : '*.CPP')}
            </div>
            <div className="flex justify-between text-[#55FFFF]">
              <span className="font-bold">{selectedFile ? selectedFile.dosName : 'SUAREZ.CPP'}</span>
              <span>
                {selectedFile ? `${selectedFile.sizeBytes} bytes` : '0 bytes'}
              </span>
              <span>{formattedDate} {formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Dialog Footer status: Enter directory path and file-name mask */}
        <div className="h-5 bg-[#A8A8A8] border-t border-black px-2 flex items-center text-[10px] text-black">
          <span className="font-bold mr-2">Help</span>
          <span className="text-zinc-600 mr-2">|</span>
          <span className="truncate">Enter directory path and file-name mask</span>
        </div>
      </div>
    </div>
  );
};
