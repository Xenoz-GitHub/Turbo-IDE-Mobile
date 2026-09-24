/**
 * Native Files Manager & Virtual Workspace Screen
 * Implements 8.3 filename mapping view, C: & D: drive navigation,
 * import/export, file creation, and sample loading.
 * Credits: ENCRYPTED CREW
 */

import React, { useState } from 'react';
import { DosFile } from '../types/emulator';
import { globalFileMapper } from '../utils/fileMapper';
import { SAMPLE_PROGRAMS, VIRTUAL_SYSTEM_FILES } from '../data/samplePrograms';
import {
  Folder,
  FileCode,
  FileText,
  Plus,
  Trash2,
  Download,
  Upload,
  Copy,
  Check,
  HardDrive,
  AlertCircle,
  X
} from 'lucide-react';

interface FileManagerModalProps {
  files: DosFile[];
  activeFileId: string;
  onSelectFile: (file: DosFile) => void;
  onCreateFile: (fileName: string, content?: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (file: DosFile) => void;
  onImportFile: (fileName: string, content: string) => void;
  onSaveToPhone?: (file: DosFile, isAll?: boolean) => void;
  onClose: () => void;
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onDuplicateFile,
  onImportFile,
  onSaveToPhone,
  onClose
}) => {
  const [activeDrive, setActiveDrive] = useState<'D' | 'C'>('D');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showMappingTable, setShowMappingTable] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setShowNewFileInput(false);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleExport = (file: DosFile) => {
    if (onSaveToPhone) {
      onSaveToPhone(file, false);
      return;
    }
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.hostName || file.dosName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        onImportFile(file.name, content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentList = activeDrive === 'D' ? files : VIRTUAL_SYSTEM_FILES;
  const mappings = globalFileMapper.getAllMappings();

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 font-sans">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <HardDrive className="text-cyan-400" size={20} />
            <h2 className="font-bold text-white text-base">Virtual DOS Workspace & Files</h2>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
              {activeDrive}:\
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drive Selector & Actions Bar */}
        <div className="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          {/* Drive tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveDrive('D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeDrive === 'D'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <span>D:\ USER WORKSPACE</span>
              <span className="text-[10px] bg-blue-900/60 px-1 rounded">R/W</span>
            </button>
            <button
              onClick={() => setActiveDrive('C')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeDrive === 'C'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <span>C:\TC SYSTEM</span>
              <span className="text-[10px] bg-purple-900/60 px-1 rounded">RO</span>
            </button>
          </div>

          {/* Quick Actions (only for D: drive) */}
          {activeDrive === 'D' && (
            <div className="flex items-center gap-1.5">
              <label className="cursor-pointer px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs">
                <Upload size={13} />
                <span>Import</span>
                <input
                  type="file"
                  accept=".c,.cpp,.h,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <button
                onClick={() => setShowNewFileInput(!showNewFileInput)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus size={13} />
                <span>New File</span>
              </button>

              <button
                onClick={() => setShowMappingTable(!showMappingTable)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border ${
                  showMappingTable
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <span>8.3 Map</span>
              </button>

              {onSaveToPhone && (
                <button
                  onClick={() => onSaveToPhone(files[0] || currentList[0], true)}
                  className="px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                  title="Export All Projects to Phone Files/Downloads"
                >
                  <Download size={13} />
                  <span>Save All to Phone</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* New File Inline Form */}
        {showNewFileInput && activeDrive === 'D' && (
          <form onSubmit={handleCreate} className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. matrix.cpp or student_test.c"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewFileInput(false)}
              className="px-2 py-1.5 text-zinc-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </form>
        )}

        {/* 8.3 Filename Mapping Table Modal view */}
        {showMappingTable && (
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 max-h-40 overflow-y-auto text-xs">
            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <AlertCircle size={14} />
              <span>DOS 8.3 Filename Translation Table (Persisted & Collision-Safe)</span>
            </div>
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="pb-1">Host Long Name</th>
                  <th className="pb-1">DOS 8.3 Virtual Name</th>
                  <th className="pb-1">Collision Index</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, idx) => (
                  <tr key={idx} className="border-b border-zinc-800/40 text-zinc-300">
                    <td className="py-0.5">{m.hostName}</td>
                    <td className="py-0.5 text-cyan-300 font-bold">{m.dosName}</td>
                    <td className="py-0.5">{m.collisionIndex > 0 ? `~${m.collisionIndex}` : 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Files List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
          {currentList.map(file => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => {
                  if (activeDrive === 'D') {
                    onSelectFile(file);
                    onClose();
                  }
                }}
                className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                  activeDrive === 'D' ? 'cursor-pointer' : 'cursor-default'
                } ${
                  isActive
                    ? 'bg-blue-950/50 border-blue-600/80 text-white'
                    : 'bg-zinc-850/60 border-zinc-800/80 hover:bg-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded bg-zinc-800 text-cyan-400">
                    <FileCode size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cyan-300">{file.dosName}</span>
                      {file.hostName !== file.dosName && (
                        <span className="text-xs text-zinc-400 truncate">({file.hostName})</span>
                      )}
                      {isActive && (
                        <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                          ACTIVE IN IDE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Size: {file.sizeBytes || file.content.length} bytes · Modified:{' '}
                      {new Date(file.lastModified).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* File actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleExport(file)}
                    className="p-1.5 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-700/60 rounded"
                    title="Export / Download File"
                  >
                    <Download size={15} />
                  </button>
                  {activeDrive === 'D' && (
                    <>
                      <button
                        onClick={() => onDuplicateFile(file)}
                        className="p-1.5 text-zinc-400 hover:text-amber-300 hover:bg-zinc-700/60 rounded"
                        title="Duplicate File"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete '${file.dosName}'?`)) {
                            onDeleteFile(file.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/60 rounded"
                        title="Delete File"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Pre-installed Sample Programs Quick Bar */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-2">
          <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
            <span>Quick-Load Verified Borland Sample Programs:</span>
            <span className="text-[10px] text-zinc-500">Zero-configuration C:\TC\BGI</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SAMPLE_PROGRAMS.map(sample => (
              <button
                key={sample.id}
                onClick={() => {
                  onSelectFile(sample);
                  onClose();
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-mono font-bold whitespace-nowrap flex items-center gap-1"
              >
                <span>{sample.dosName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
