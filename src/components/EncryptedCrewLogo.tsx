/**
 * Official Encrypted Crew Cyber Banner
 * Renders the official Encrypted Crew image banner. No white background.
 * Credits: ENCRYPTED CREW
 */

import React from 'react';

interface EncryptedCrewLogoProps {
  className?: string;
}

export const EncryptedCrewLogo: React.FC<EncryptedCrewLogoProps> = ({
  className = ''
}) => {
  return (
    <div
      className={`w-full max-w-sm rounded-xl overflow-hidden relative flex flex-col items-center justify-center select-none shadow-xl shadow-teal-950/40 border border-teal-500/30 bg-black/60 p-2 ${className}`}
    >
      <img
        src="https://i.ibb.co/23NVPd4f/Chat-GPT-Image-Sep-23-2026-11-29-30-PM.png"
        alt="Encrypted Crew"
        className="w-full h-auto max-h-[160px] object-contain rounded-lg"
        loading="eager"
      />
    </div>
  );
};
