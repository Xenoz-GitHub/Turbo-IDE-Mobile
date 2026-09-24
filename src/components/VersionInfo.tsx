/**
 * Version Info Component
 * Displays current version, build info, and update status
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React, { useState, useEffect } from 'react';
import { 
  Info, 
  Download, 
  CheckCircle, 
  RefreshCw, 
  Calendar, 
  Code2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { APP_VERSION, getFullVersionString, getBuildInfo } from '../config/version';
import { updateService } from '../utils/updateService';

interface VersionInfoProps {
  onCheckUpdate?: () => void;
  showUpdateButton?: boolean;
}

export function VersionInfo({ onCheckUpdate, showUpdateButton = true }: VersionInfoProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Load last check time
    const cached = updateService.getCachedUpdateInfo();
    if (cached) {
      setUpdateAvailable(cached.hasUpdate);
    }

    const lastCheckStr = localStorage.getItem('tc_last_update_check');
    if (lastCheckStr) {
      setLastCheck(new Date(parseInt(lastCheckStr)));
    }
  }, []);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    
    try {
      const updateInfo = await updateService.checkForUpdates();
      
      if (updateInfo) {
        setUpdateAvailable(updateInfo.hasUpdate);
        setLastCheck(new Date());
        
        if (onCheckUpdate) {
          onCheckUpdate();
        }
      }
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatLastCheck = () => {
    if (!lastCheck) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastCheck.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0000AA] to-[#0000CC] px-4 py-3 border-b border-cyan-500/40">
        <div className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-cyan-300" />
          <span className="font-bold text-white">Version Information</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Version Display */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-white font-bold text-xl">
              {getFullVersionString()}
            </div>
            <div className="text-zinc-400 text-xs">
              {getBuildInfo()}
            </div>
          </div>

          {updateAvailable && (
            <div className="px-2.5 py-1 bg-cyan-500/20 border border-cyan-400/40 rounded-full text-cyan-300 text-xs font-bold flex items-center space-x-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Update Available</span>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-zinc-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-zinc-500">Version Code</div>
              <div className="font-semibold">{APP_VERSION.versionCode}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-zinc-300">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-zinc-500">Build Date</div>
              <div className="font-semibold">{APP_VERSION.buildDate}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-zinc-300">
            <Download className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-zinc-500">Release Channel</div>
              <div className="font-semibold capitalize">{APP_VERSION.releaseChannel}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-zinc-300">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-zinc-500">Last Update Check</div>
              <div className="font-semibold">{formatLastCheck()}</div>
            </div>
          </div>
        </div>

        {/* Developer Info */}
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          <div className="text-xs text-zinc-400">
            <strong className="text-zinc-300">Developed by:</strong> Suarez J. (XenozExe)
          </div>
          <div className="text-xs text-zinc-400">
            <strong className="text-zinc-300">Team:</strong> ENCRYPTED CREW
          </div>
          <div className="text-xs text-zinc-400">
            <strong className="text-zinc-300">License:</strong> MIT & GPL-2.0
          </div>
        </div>

        {/* Check Update Button */}
        {showUpdateButton && (
          <button
            onClick={handleCheckUpdate}
            disabled={isChecking}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking for Updates...' : 'Check for Updates'}</span>
          </button>
        )}

        {/* Additional Links */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <a
            href="https://github.com/Xenoz-GitHub/Turbo-cpp-ide-mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
          >
            <span>Source Code</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-zinc-700">•</span>
          <a
            href="https://github.com/Xenoz-GitHub/Turbo-cpp-ide-mobile/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
          >
            <span>Release Notes</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
