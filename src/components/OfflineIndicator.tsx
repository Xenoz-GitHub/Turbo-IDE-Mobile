import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-14 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600/95 text-white px-3 py-1.5 text-xs font-mono font-medium shadow-xl border border-amber-400/50 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <WifiOff size={14} className="text-yellow-200 shrink-0" />
      <span>Offline Mode &bull; Local Turbo C++ compiler & storage are active</span>
    </div>
  );
};
