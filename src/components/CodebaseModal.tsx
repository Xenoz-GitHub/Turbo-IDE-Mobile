/**
 * Codebase Explorer & Architecture Reviewer
 * Allows developers and store reviewers to inspect native C++, Kotlin, Swift, CMake, and Docs
 * Credits: ENCRYPTED CREW
 */

import React, { useState } from 'react';
import { REPO_CODEBASE, RepoFile } from '../data/repoCodebase';
import { FolderTree, FileCode, Copy, Check, Download, X, Layers } from 'lucide-react';

interface CodebaseModalProps {
  onClose: () => void;
}

export const CodebaseModal: React.FC<CodebaseModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<RepoFile>(REPO_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'core', label: 'Core (/core)' },
    { id: 'bridge', label: 'Bridge (/bridge)' },
    { id: 'android', label: 'Android (/android)' },
    { id: 'ios', label: 'iOS (/ios)' },
    { id: 'assets', label: 'Assets (/assets)' },
    { id: 'docs', label: 'Docs (/docs)' },
  ];

  const filteredFiles = activeCategory === 'all'
    ? REPO_CODEBASE
    : REPO_CODEBASE.filter(f => f.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 font-sans">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Layers className="text-cyan-400" size={18} />
            <h2 className="font-bold text-white text-base">Native Multi-Platform Repository Codebase</h2>
            <span className="text-xs bg-zinc-800 text-cyan-300 px-2 py-0.5 rounded font-mono">
              Android + iOS + Core C++
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded">
            <X size={18} />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1 px-3 py-2 bg-zinc-950/60 border-b border-zinc-800 overflow-x-auto text-xs">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Sidebar */}
          <div className="w-64 bg-zinc-950 border-r border-zinc-800 p-2 overflow-y-auto space-y-1">
            {filteredFiles.map(file => {
              const isSelected = file.path === selectedFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-blue-600/30 text-cyan-300 font-bold border border-blue-500/40'
                      : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  <FileCode size={14} className="shrink-0 text-cyan-400" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-zinc-950/90 overflow-hidden">
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
              <span className="font-mono text-xs font-bold text-cyan-300">{selectedFile.path}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-3 overflow-auto font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre bg-zinc-950">
              {selectedFile.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
