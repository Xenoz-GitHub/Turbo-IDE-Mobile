/**
 * Changelog Viewer Component
 * Displays version history and release notes
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React, { useState } from 'react';
import { X, GitBranch, Calendar, Tag, AlertTriangle, Sparkles } from 'lucide-react';
import { VERSION_HISTORY } from '../config/version';

interface ChangelogViewerProps {
  onClose: () => void;
}

export function ChangelogViewer({ onClose }: ChangelogViewerProps) {
  const [selectedVersion, setSelectedVersion] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border-2 border-cyan-500/60 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0000AA] to-[#0000CC] px-4 py-3 border-b border-cyan-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-cyan-300" />
            <span className="font-bold text-white tracking-wider text-sm sm:text-base">
              VERSION HISTORY & CHANGELOG
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

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Version List (Sidebar) */}
          <div className="w-full sm:w-48 bg-zinc-950/80 border-b sm:border-b-0 sm:border-r border-zinc-800 overflow-y-auto shrink-0">
            <div className="p-3 space-y-1">
              {VERSION_HISTORY.map((release, index) => (
                <button
                  key={release.versionCode}
                  onClick={() => setSelectedVersion(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    selectedVersion === index
                      ? 'bg-cyan-600 text-black font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>v{release.version}</span>
                  </div>
                  {index === 0 && (
                    <div className="text-[10px] mt-0.5 text-cyan-300 font-semibold">
                      CURRENT
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Changelog Details */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {VERSION_HISTORY[selectedVersion] && (
              <div className="space-y-4">
                {/* Version Header */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-white">
                      Version {VERSION_HISTORY[selectedVersion].version}
                    </h2>
                    {selectedVersion === 0 && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 rounded text-cyan-300 text-xs font-bold">
                        LATEST
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-zinc-400">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{VERSION_HISTORY[selectedVersion].releaseDate}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Build {VERSION_HISTORY[selectedVersion].versionCode}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    {VERSION_HISTORY[selectedVersion].critical && (
                      <div className="px-2 py-0.5 bg-red-500/20 border border-red-400/40 rounded text-red-300 text-xs font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>CRITICAL</span>
                      </div>
                    )}
                    {VERSION_HISTORY[selectedVersion].breaking && (
                      <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 rounded text-amber-300 text-xs font-bold">
                        BREAKING CHANGES
                      </div>
                    )}
                  </div>
                </div>

                {/* Changes List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>What's New:</span>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {VERSION_HISTORY[selectedVersion].changes.map((change, idx) => (
                      <li
                        key={idx}
                        className="flex items-start space-x-3 text-zinc-300 leading-relaxed"
                      >
                        <span className="text-cyan-400 mt-1 shrink-0">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Divider for older versions */}
                {selectedVersion > 0 && (
                  <div className="pt-4 mt-4 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500 italic">
                      This is a historical release. Check newer versions for latest features.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-500">
            {VERSION_HISTORY.length} version{VERSION_HISTORY.length > 1 ? 's' : ''} in history
          </div>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
