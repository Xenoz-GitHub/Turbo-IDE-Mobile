/**
 * Update Notification Component
 * Universal update notification for Android, iOS, and PWA
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Smartphone, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { UpdateInfo } from '../utils/updateService';

interface UpdateNotificationProps {
  updateInfo: UpdateInfo;
  platform: 'android' | 'ios' | 'desktop';
  isStandalone: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateNotification({
  updateInfo,
  platform,
  isStandalone,
  onUpdate,
  onDismiss,
}: UpdateNotificationProps) {
  const [countdown, setCountdown] = useState(updateInfo.critical ? 10 : 0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Critical updates have countdown
  useEffect(() => {
    if (!updateInfo.critical || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [updateInfo.critical, countdown]);

  // Auto-update after countdown
  useEffect(() => {
    if (updateInfo.critical && countdown === 0) {
      onUpdate();
    }
  }, [countdown, updateInfo.critical, onUpdate]);

  const getUpdateActionText = () => {
    if (platform === 'android' && !isStandalone) {
      return 'Download APK Update';
    }
    if (platform === 'android' && isStandalone) {
      return 'Download & Install Update';
    }
    if (platform === 'ios') {
      return 'Update Instructions';
    }
    return 'Reload to Update';
  };

  const getUpdateIcon = () => {
    if (platform === 'android') return <Smartphone className="w-5 h-5" />;
    if (platform === 'ios') return <ExternalLink className="w-5 h-5" />;
    return <RefreshCw className="w-5 h-5" />;
  };

  const getCriticalIcon = () => {
    if (updateInfo.critical) {
      return <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />;
    }
    return <Sparkles className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300 max-w-md mx-auto">
      <div
        className={`rounded-xl shadow-2xl overflow-hidden border-2 ${
          updateInfo.critical
            ? 'bg-gradient-to-br from-red-900/95 to-orange-900/95 border-red-500/60'
            : 'bg-gradient-to-br from-cyan-900/95 to-blue-900/95 border-cyan-400/60'
        } backdrop-blur-md`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 flex items-center justify-between border-b ${
            updateInfo.critical
              ? 'bg-red-950/80 border-red-500/40'
              : 'bg-cyan-950/80 border-cyan-400/40'
          }`}
        >
          <div className="flex items-center space-x-2">
            {getCriticalIcon()}
            <span className="font-bold text-white text-sm">
              {updateInfo.critical ? '⚠️ Critical Update Required' : 'New Version Available'}
            </span>
          </div>
          {!updateInfo.critical && (
            <button
              onClick={onDismiss}
              className={`p-1 rounded hover:bg-black/30 transition-colors ${
                updateInfo.critical ? 'text-red-300' : 'text-cyan-300'
              } hover:text-white`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Version Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-base">
                Version {updateInfo.currentVersion}
              </div>
              <div className="text-xs text-zinc-300">
                Build {updateInfo.versionCode}
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full font-bold text-xs ${
                updateInfo.critical
                  ? 'bg-red-500/20 border border-red-400/40 text-red-300'
                  : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
              }`}
            >
              {updateInfo.critical ? 'REQUIRED' : 'AVAILABLE'}
            </div>
          </div>

          {/* Changelog */}
          {updateInfo.changelog && updateInfo.changelog.length > 0 && (
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center space-x-1"
              >
                <span>{isExpanded ? '▼' : '▶'} What's new</span>
              </button>

              {isExpanded && (
                <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                  {updateInfo.changelog.slice(0, 5).map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                  {updateInfo.changelog.length > 5 && (
                    <li className="text-zinc-400 italic">
                      +{updateInfo.changelog.length - 5} more changes
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* File Size */}
          {updateInfo.fileSize > 0 && platform === 'android' && (
            <div className="text-xs text-zinc-400">
              Download size: {(updateInfo.fileSize / 1024 / 1024).toFixed(2)} MB
            </div>
          )}

          {/* Critical Countdown */}
          {updateInfo.critical && countdown > 0 && (
            <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-3 text-center">
              <div className="text-red-200 font-bold text-sm">
                Auto-updating in {countdown} seconds...
              </div>
              <div className="text-xs text-red-300/80 mt-1">
                This update contains critical security fixes
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-black/20 border-t border-white/10 flex items-center gap-2">
          <button
            onClick={onUpdate}
            disabled={updateInfo.critical && countdown > 0}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${
              updateInfo.critical
                ? 'bg-red-500 hover:bg-red-400 active:bg-red-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {getUpdateIcon()}
            <span>{getUpdateActionText()}</span>
          </button>

          {!updateInfo.critical && (
            <button
              onClick={onDismiss}
              className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
            >
              Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
