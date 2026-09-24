/**
 * ShowcaseLandingPage.tsx
 * Production-quality Showcase, Installation & Web Coding Landing Page for Turbo C++ Mobile.
 * Built for Vercel deployment, PWABuilder APK packaging, iOS Safari Add-to-Home, and instant web coding.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 * Strictly zero emojis.
 */

import React, { useState } from 'react';
import {
  Code2,
  Smartphone,
  Download,
  Share2,
  Play,
  Terminal,
  Cpu,
  Monitor,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  Zap,
  Volume2,
  FolderOpen,
  Keyboard,
  Info,
  ChevronRight,
  ChevronUp,
  Github
} from 'lucide-react';
import { AppIcon } from './AppIcon';
import { EncryptedCrewLogo } from './EncryptedCrewLogo';
import { IosInstallModal } from './IosInstallModal';
import PWABuilderHub from './PWABuilderHub';

interface ShowcaseLandingPageProps {
  onLaunchIde: (initialFileId?: string) => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  onInstallPwa: () => Promise<boolean>;
  onOpenCredits: () => void;
  onOpenLegal: () => void;
}

export function ShowcaseLandingPage({
  onLaunchIde,
  isInstallable,
  isInstalled,
  isIOS,
  isAndroid,
  onInstallPwa,
  onOpenCredits,
  onOpenLegal,
}: ShowcaseLandingPageProps) {
  // Modal states
  const [showApkModal, setShowApkModal] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col selection:bg-cyan-500 selection:text-black landing-scrollbar">
      {/* ========================================================
          STICKY TOP BRANDING & NAVIGATION BAR
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-cyan-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AppIcon size={32} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-white">
                TURBO C++ MOBILE
              </span>
              <span className="px-1.5 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/50 rounded font-semibold uppercase tracking-wider hidden sm:inline-block">
                v1.0-RELEASE
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 tracking-tight flex items-center space-x-1">
              <span>BY</span>
              <span className="text-cyan-400 font-bold">ENCRYPTED CREW</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Header Navigation */}
        <div className="flex items-center space-x-2">
          {/* Quick APK/Install trigger */}
          <button
            onClick={() => {
              if (isIOS) {
                setShowIosModal(true);
              } else {
                setShowApkModal(true);
              }
            }}
            className="px-2.5 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/40 text-cyan-300 rounded flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Download APK / Install PWA"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Install / APK</span>
          </button>

          {/* Primary High-Priority Direct Web IDE Button */}
          <button
            onClick={() => onLaunchIde()}
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-gradient-to-r from-[#0000AA] to-[#0000EE] hover:from-[#000088] hover:to-[#0000CC] text-white font-bold border border-cyan-400/60 rounded shadow-md flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-cyan-300" />
            <span>Launch Web IDE</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          HERO SECTION
          ======================================================== */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-8 border-b border-zinc-800 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-zinc-950">
        {/* Animated Retro DOS Cyber Hero Banner Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGN4bGJuMHR3cHJyOWl2ZW56MTBqODJlb2ZoMWRvcDgzcGIxdnJiYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QpVUMRUJGokfqXyfa1/giphy.gif"
            alt="Hero Background Banner"
            className="w-full h-full object-cover object-center opacity-25 mix-blend-screen filter saturate-150 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/95" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-transparent to-zinc-950" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00aaaa08_1px,transparent_1px),linear-gradient(to_bottom,#00aaaa08_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="flex-1 space-y-5 text-center lg:text-left">
            {/* Title Text Hero with Background Banner Display */}
            <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6 border border-cyan-500/30 bg-zinc-950/75 backdrop-blur-md shadow-2xl">
              <div
                className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-30 mix-blend-screen"
                style={{
                  backgroundImage: `url('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGN4bGJuMHR3cHJyOWl2ZW56MTBqODJlb2ZoMWRvcDgzcGIxdnJiYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QpVUMRUJGokfqXyfa1/giphy.gif')`
                }}
              />
              <div className="relative z-10">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Turbo C++ Mobile
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                    16-Bit DOS on Modern Devices
                  </span>
                </h1>
              </div>
            </div>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Built exclusively for mobile: the definitive handheld C/C++ environment featuring full Borland Turbo C++ 3.0 compatibility.
              Execute classic programs with <strong className="text-cyan-300">&lt;graphics.h&gt;</strong>,{' '}
              <strong className="text-cyan-300">&lt;conio.h&gt;</strong>, and PC speaker sound synthesis powered 100% by the
              specialized mobile touch virtual keyboard—no desktop keyboard allowed.
            </p>

            {/* System Status Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs">
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PWA Service Worker Active</span>
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>BGI 640x480 Graphics Engine</span>
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PWABuilder Ready</span>
              </span>
            </div>

            {/* Primary Action Buttons Matrix */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              {/* 1. Direct Web Browser Use Button */}
              <button
                onClick={() => onLaunchIde()}
                className="py-3 px-5 bg-gradient-to-r from-[#0000AA] to-[#0000DD] hover:from-[#000088] hover:to-[#0000BB] text-white font-bold rounded-lg border-2 border-cyan-400 shadow-xl flex items-center justify-center space-x-2 transition-all cursor-pointer text-sm"
              >
                <Code2 className="w-4 h-4 text-cyan-300" />
                <span>Code Directly in Browser</span>
              </button>

              {/* 2. Download APK / Install Android Button */}
              <button
                onClick={() => setShowApkModal(true)}
                className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer text-sm"
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Download APK / Android</span>
              </button>

              {/* 3. iOS Safari Add to Home Button */}
              <button
                onClick={() => setShowIosModal(true)}
                className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer text-sm"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Add to iOS Home</span>
              </button>
            </div>
          </div>

          {/* Right Column: Exact Borland Turbo C++ 3.0 Showcase Preview (Matching Image 2) */}
          <div className="w-full lg:w-[500px] shrink-0">
            <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-cyan-500/60 bg-[#000044] select-none">
              {/* TOP SYSTEM BAR (Classic Borland DOS Menu) */}
              <div className="bg-[#AAAAAA] text-black font-dos text-xs px-2 py-0.5 flex items-center justify-between border-b border-black select-none">
                <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none font-bold text-[11px]">
                  <span className="text-emerald-700 font-black cursor-default text-xs">≡</span>
                  <span><span className="text-red-600 font-black">F</span>ile</span>
                  <span><span className="text-red-600 font-black">E</span>dit</span>
                  <span><span className="text-red-600 font-black">S</span>earch</span>
                  <span><span className="text-red-600 font-black">R</span>un</span>
                  <span><span className="text-red-600 font-black">C</span>ompile</span>
                  <span><span className="text-red-600 font-black">D</span>ebug</span>
                  <span><span className="text-red-600 font-black">P</span>roject</span>
                  <span><span className="text-red-600 font-black">O</span>ptions</span>
                  <span><span className="text-red-600 font-black">W</span>indow</span>
                  <span><span className="text-red-600 font-black">H</span>elp</span>
                </div>
                <div className="hidden sm:flex items-center text-[10px] text-zinc-700 pl-2 shrink-0">
                  <span>80x25 VGA</span>
                </div>
              </div>

              {/* DESKTOP WORKSPACE WITH RETRO DITHER PATTERN & ACTIVE BORLAND WINDOW */}
              <div
                className="p-2 sm:p-2.5 relative"
                style={{
                  backgroundColor: '#000088',
                  backgroundImage: 'radial-gradient(#000055 25%, transparent 25%), radial-gradient(#000055 25%, transparent 25%)',
                  backgroundPosition: '0 0, 2px 2px',
                  backgroundSize: '4px 4px'
                }}
              >
                {/* ACTIVE BORLAND EDITOR WINDOW WITH DOUBLE CYAN BORDER */}
                <div className="border-2 border-[#00AAAA] bg-[#0000AA] shadow-xl overflow-hidden font-dos">
                  {/* WINDOW TITLE BAR */}
                  <div className="bg-[#0000AA] border-b border-[#00AAAA] px-1.5 py-0.5 flex items-center justify-between text-xs text-white select-none">
                    <div className="flex items-center space-x-1 text-[#00FFFF] font-bold text-[11px]">
                      <span>[</span>
                      <span className="w-2 h-2 bg-[#00FF00] inline-block"></span>
                      <span>]</span>
                    </div>
                    <div className="font-bold tracking-wider text-white text-[11px] sm:text-[12px] flex items-center space-x-1">
                      <span className="text-[#00AAAA] font-normal">═</span>
                      <span>D:\WELCOME.CPP</span>
                      <span className="text-[#00AAAA] font-normal">═</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[#00FFFF] text-[11px] font-bold">
                      <span>1=</span>
                      <span className="text-[#00FF00] font-black">[↓]</span>
                    </div>
                  </div>

                  {/* CODE BODY AND VERTICAL SCROLLBAR */}
                  <div className="flex h-72 sm:h-80 relative overflow-hidden bg-[#0000AA]">
                    {/* CODE TEXT CONTENT (Exact syntax highlighting and code from Image 2) */}
                    <div className="flex-1 p-2 overflow-x-auto overflow-y-hidden text-[11px] sm:text-[12px] leading-[17px] text-white whitespace-pre select-none scrollbar-none font-dos">
                      <div className="text-[#C0C0C0]">/*</div>
                      <div className="text-[#C0C0C0]"> * ===================================================</div>
                      <div className="text-[#C0C0C0]"> *   TURBO C++ 3.0 MOBILE - ENCRYPTED CREW</div>
                      <div className="text-[#C0C0C0]"> * ===================================================</div>
                      <div className="text-[#C0C0C0]"> *   Warm Welcome &amp; Introduction!</div>
                      <div className="text-[#C0C0C0]"> *   Original Borland Turbo C++ 3.0 Mobile Environm</div>
                      <div className="text-[#C0C0C0]"> *   Developed by Suarez J. (XenozExe)</div>
                      <div className="text-[#C0C0C0]"> * ===================================================</div>
                      <div className="text-[#C0C0C0]"> */</div>
                      <div>&nbsp;</div>
                      <div className="text-[#00FFFF]">#include &lt;iostream.h&gt;</div>
                      <div className="text-[#00FFFF]">#include &lt;conio.h&gt;</div>
                      <div className="text-[#00FFFF]">#include &lt;dos.h&gt;</div>
                      <div>&nbsp;</div>
                      <div><span className="text-white font-bold">void</span> <span className="text-white font-bold">main</span>()</div>
                      <div className="text-white">&#123;</div>
                      <div className="pl-4"><span className="text-[#00FF00] font-bold">clrscr</span>();</div>
                      <div className="pl-4"><span className="text-[#00FF00] font-bold">textcolor</span>(<span className="text-[#00FFFF]">14</span>); <span className="text-[#C0C0C0]">// Yellow</span></div>
                      <div className="pl-4"><span className="text-[#00FF00] font-bold">cprintf</span>(<span className="text-[#FF5555]">&quot;=========================================&quot;</span>);</div>
                      <div className="pl-4"><span className="text-[#00FF00] font-bold">cprintf</span>(<span className="text-[#FF5555]">&quot;        WELCOME TO TURBO C++ 3.0 MOBILE&quot;</span>);</div>
                      <div className="pl-4"><span className="text-[#00FF00] font-bold">cprintf</span>(<span className="text-[#FF5555]">&quot;               ENCRYPTED CREW&quot;</span>);</div>
                      <div className="pl-4 flex items-center">
                        <span className="text-[#00FF00] font-bold">cprintf</span>(<span className="text-[#FF5555]">&quot;</span>
                        <span className="inline-block w-2 h-3.5 bg-white ml-0.5 animate-pulse"></span>
                      </div>
                    </div>

                    {/* RIGHT VERTICAL SCROLLBAR */}
                    <div className="w-4 bg-[#00AAAA] flex flex-col justify-between items-center shrink-0 select-none border-l border-[#00FFFF]">
                      <div className="w-full h-4 text-black flex items-center justify-center text-[9px] font-black cursor-default">
                        ▲
                      </div>
                      <div className="flex-1 w-full relative py-1 flex items-start justify-center">
                        <div className="w-3 h-8 bg-[#0000AA] border border-white"></div>
                      </div>
                      <div className="w-full h-4 text-black flex items-center justify-center text-[9px] font-black cursor-default">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM HORIZONTAL SCROLLBAR / STATUS BAR */}
                  <div className="h-5 bg-[#0000AA] border-t border-[#00AAAA] flex items-center justify-between shrink-0 select-none text-[11px] text-white">
                    <div className="flex items-center px-1 font-mono text-[#00FFFF] font-bold text-[10px] space-x-1 shrink-0">
                      <span className="border border-[#00AAAA] px-1 bg-[#000088]">* 1:1</span>
                    </div>
                    <div className="flex-1 h-full bg-[#00AAAA] flex items-center justify-between px-1 mx-1 border-x border-[#00FFFF]">
                      <span className="text-black text-[9px] font-black">◄</span>
                      <div className="w-8 h-3 bg-[#0000AA] border border-white"></div>
                      <span className="text-black text-[9px] font-black">►</span>
                    </div>
                    <div className="px-1 text-[#00FFFF] font-bold text-xs">
                      ╝
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM SYSTEM COMMAND BAR */}
              <div className="bg-[#AAAAAA] text-black font-dos text-xs px-2 py-1 flex items-center justify-between border-t border-black select-none">
                <div className="flex items-center space-x-2 sm:space-x-3 font-bold text-[11px] overflow-x-auto scrollbar-none">
                  <span><span className="text-red-600 font-black">H</span>elp</span>
                  <span><span className="text-red-600 font-black">S</span>ave</span>
                  <span><span className="text-red-600 font-black">O</span>pen</span>
                  <span><span className="text-red-600 font-black">C</span>ompile</span>
                  <button
                    onClick={() => onLaunchIde('welcome')}
                    className="px-1.5 py-0.5 bg-[#00AA00] hover:bg-[#00CC00] active:bg-[#008800] text-black font-black rounded text-[10px] flex items-center space-x-1 cursor-pointer shadow-xs transition-transform active:scale-95"
                    title="Run program in Turbo C++ Mobile"
                  >
                    <span>►</span>
                    <span><span className="text-red-900 font-black">R</span>un</span>
                  </button>
                  <span><span className="text-red-600 font-black">M</span>enu</span>
                </div>
                <span className="text-[10px] text-zinc-800 font-mono hidden sm:inline">D:\WELCOME.CPP</span>
              </div>

              {/* BOTTOM CALL-TO-ACTION TRAY */}
              <div className="p-2.5 bg-zinc-950 flex items-center justify-between text-xs border-t border-zinc-800">
                <div className="text-zinc-400 flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px]">Borland C++ 3.0 Real VGA Core</span>
                </div>
                <button
                  onClick={() => onLaunchIde('welcome')}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black font-black rounded-lg flex items-center space-x-1.5 transition-all shadow-md cursor-pointer text-xs"
                >
                  <span>Open D:\WELCOME.CPP in IDE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          QUICK FEATURE PILLARS
          ======================================================== */}
      <section className="py-8 px-4 sm:px-8 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div className="w-8 h-8 rounded bg-[#000088] text-cyan-300 flex items-center justify-center border border-cyan-500/40">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Real 16-Bit DOS Core</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Authentic x86 real-mode CPU emulation with 16MB EMS/XMS memory, Borland runtime directories, and standard
              headers.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div className="w-8 h-8 rounded bg-[#000088] text-cyan-300 flex items-center justify-center border border-cyan-500/40">
              <Monitor className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Hardware &lt;graphics.h&gt;</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Full BGI graphics driver support: 640x480 resolution, 16-color EGA/VGA palette, line, circle, arc, and
              floodfill routines.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div className="w-8 h-8 rounded bg-[#000088] text-cyan-300 flex items-center justify-center border border-cyan-500/40">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Touch Virtual Keyboard</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Engineered exclusively for mobile touchscreens: quick on-screen access to Ctrl, Alt, Esc, braces, brackets, coding symbols, and Web Haptic feedback on every touch.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div className="w-8 h-8 rounded bg-[#000088] text-cyan-300 flex items-center justify-center border border-cyan-500/40">
              <FolderOpen className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">DOS 8.3 File Bridge</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Persistent storage mounted to D:\ drive, 8.3 filename mapping, import/export C/CPP files, and browser local
              caching.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          IOS SAFARI & ADD TO HOME SECTION
          ======================================================== */}
      <section className="py-10 sm:py-14 px-4 sm:px-8 border-b border-zinc-800 bg-zinc-900/40">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="text-xs text-sky-400 font-semibold tracking-wider uppercase">
              APPLE IOS &amp; IPADOS SUPPORT
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Install on iPhone and iPad via Safari
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
              iOS Safari lets you install Turbo C++ Mobile directly to your home screen. When launched from the icon, it
              operates in dedicated standalone mode with no Safari address bar or navigation tabs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs w-full max-w-xl pt-1">
              <div className="flex items-center space-x-2.5 px-3.5 py-2.5 bg-zinc-800/80 rounded-lg border border-zinc-700/80 text-zinc-200 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span className="font-medium">Tap Share in Safari</span>
              </div>
              <div className="flex items-center space-x-2.5 px-3.5 py-2.5 bg-zinc-800/80 rounded-lg border border-zinc-700/80 text-zinc-200 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span className="font-medium">Tap &quot;Add to Home Screen&quot;</span>
              </div>
              <div className="flex items-center space-x-2.5 px-3.5 py-2.5 bg-zinc-800/80 rounded-lg border border-zinc-700/80 text-zinc-200 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span className="font-medium">Tap &quot;Add&quot;</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setShowIosModal(true)}
              className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg border border-sky-400/60 shadow-lg flex items-center space-x-2 transition-colors cursor-pointer text-xs sm:text-sm"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Open iOS Installation Guide</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          DETAILED TECHNICAL MATRIX & VERIFICATION
          ======================================================== */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="text-xs text-cyan-400 font-semibold tracking-wider uppercase">
              TECHNICAL SPECIFICATIONS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Complete Borland Turbo C++ 3.0 Compatibility
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800 text-xs">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Graphics Library (&lt;graphics.h&gt;)</span>
              </div>
              <div className="text-zinc-400 sm:text-right">
                initgraph, closegraph, line, circle, arc, rectangle, outtextxy, setcolor, setbkcolor, setfillstyle, floodfill
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Console I/O (&lt;conio.h&gt;)</span>
              </div>
              <div className="text-zinc-400 sm:text-right">
                clrscr, textcolor, textbackground, gotoxy, wherex, wherey, getch, getche, kbhit, delay, cprintf
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>System &amp; Audio (&lt;dos.h&gt;)</span>
              </div>
              <div className="text-zinc-400 sm:text-right">
                sound, nosound, sleep, delay, union REGS, int86, inportb, outportb
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Mobile Virtual Keyboard</span>
              </div>
              <div className="text-zinc-400 sm:text-right">
                Dedicated on-screen Compile, Run, Esc, Tab, sticky Ctrl/Alt modifiers, arrow navigation, and Web Haptics
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Storage &amp; File Management</span>
              </div>
              <div className="text-zinc-400 sm:text-right">
                Native Android Downloads / File System Access API, 8.3 FAT filename mapping, export/import .CPP &amp; .H files
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          PROFESSIONAL FOOTER & ATTRIBUTION
          ======================================================== */}
      <footer className="mt-auto bg-black border-t border-zinc-800/80 px-4 sm:px-8 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Pre-Footer Action Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#000077]/90 via-[#000044]/90 to-zinc-950 border-2 border-cyan-500/40 p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>INSTANT COMPILATION &amp; EXECUTION</span>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  Start Coding in Borland Turbo C++ 3.0 Today
                </h3>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                  Run authentic 16-bit real-mode C and C++ programs directly inside your mobile browser. No command-line setup or complex installation required.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                <button
                  onClick={() => onLaunchIde()}
                  className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-black rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer text-sm transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current text-black" />
                  <span>Launch Web IDE</span>
                </button>
                <button
                  onClick={() => setShowApkModal(true)}
                  className="py-3 px-5 bg-zinc-900/90 hover:bg-zinc-800 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer text-xs sm:text-sm font-semibold"
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Android APK</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Footer Navigation Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pt-6">
            {/* Col 1 & 2: Brand Identity, Lead Developer & Live Status */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <AppIcon size={34} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-base text-white tracking-wider">
                      TURBO C++ MOBILE
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/50 rounded font-bold">
                      v1.0.0-PROD
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Borland Turbo C++ 3.0 Mobile &amp; Web Platform
                  </div>
                </div>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                Engineered with high fidelity for students, developers, and retro enthusiasts. Delivers authentic x86 DOS real-mode execution, full &lt;graphics.h&gt; BGI emulation, conio.h routines, and low-latency mobile keyboard controls.
              </p>

              {/* Live Status Indicators */}
              <div className="p-3 bg-zinc-950/90 border border-zinc-800/80 rounded-lg space-y-2 max-w-sm">
                <div className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-cyan-400 font-bold">PRODUCTION RUNTIME</span>
                  <span className="text-[10px] text-zinc-500">CLIENT-SIDE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>DOS Core: Active</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>PWA: Precached</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>BGI: 640x480 VGA</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Audio: PC Speaker</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-400 pt-1">
                Engineered by <span className="text-zinc-200 font-bold">Suarez J. (XenozExe)</span> • <span className="text-cyan-400 font-bold">ENCRYPTED CREW</span>
              </div>
            </div>

            {/* Col 3: Platforms */}
            <div className="space-y-3 text-xs">
              <h4 className="text-white font-bold tracking-wider uppercase text-xs flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Platforms</span>
              </h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <button
                    onClick={() => onLaunchIde()}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    <span>Web Browser IDE</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowApkModal(true)}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    <span>Android WebAPK (1-Click)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowApkModal(true)}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    <span>Android Studio TWA (.ZIP)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowApkModal(true)}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    <span>PWABuilder Cloud Studio</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowIosModal(true)}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    <span>iOS Safari Standalone Mode</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Technical Stack */}
            <div className="space-y-3 text-xs">
              <h4 className="text-white font-bold tracking-wider uppercase text-xs flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Runtime Tech</span>
              </h4>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>&lt;graphics.h&gt; BGI Graphics</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>&lt;conio.h&gt; textcolor &amp; clrscr</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>&lt;dos.h&gt; delay &amp; PC Speaker</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Mobile Touch Keyboard (Compile, Run, Shortcuts)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>16MB EMS/XMS Expanded RAM</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>FAT 8.3 Virtual Drive D:\</span>
                </li>
              </ul>
            </div>

            {/* Col 5: Open Source & Legal */}
            <div className="space-y-3 text-xs">
              <h4 className="text-white font-bold tracking-wider uppercase text-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Resources &amp; Legal</span>
              </h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <button
                    onClick={onOpenCredits}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    <span>Project Credits &amp; Authors</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenLegal}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    <span>Legal Notice &amp; Trademarks</span>
                  </button>
                </li>
                <li>
                  <a
                    href="https://github.com/Xenoz-GitHub/Turbo-cpp-ide-mobile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-300 transition-colors flex items-center space-x-1 text-zinc-300"
                  >
                    <Github className="w-3.5 h-3.5 text-cyan-400" />
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500 ml-0.5" />
                  </a>
                </li>
                <li className="pt-2">
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded text-[11px] text-zinc-400 leading-normal">
                    Free and open educational implementation under MIT &amp; GPL-2.0.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Sub-Footer Bottom Bar */}
          <div className="pt-6 border-t border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="space-y-1 text-center md:text-left">
              <div>
                &copy; 2026 <strong className="text-zinc-300">Turbo C++ Mobile</strong> • An <strong className="text-cyan-400">ENCRYPTED CREW</strong> Production. Developed by Suarez J. (XenozExe).
              </div>
              <div className="text-[11px] text-zinc-500">
                Borland® and Turbo C++® are registered trademarks. This software is an independent educational tool.
              </div>
            </div>

            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const scrollContainer = document.querySelector('.landing-scrollbar');
                if (scrollContainer) {
                  scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-300 rounded-lg flex items-center space-x-1.5 text-xs transition-colors cursor-pointer shrink-0"
              title="Scroll smoothly back to top"
            >
              <span>Back to top</span>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showApkModal && (
        <PWABuilderHub
          onClose={() => setShowApkModal(false)}
        />
      )}

      {showIosModal && (
        <IosInstallModal
          onClose={() => setShowIosModal(false)}
          onLaunchIde={() => {
            setShowIosModal(false);
            onLaunchIde();
          }}
        />
      )}
    </div>
  );
}
