/**
 * Turbo C++ Mobile Virtual Keyboard
 * Engineered specifically for mobile touchscreen C/C++ programming:
 * - Single streamlined top bar with OUTPUT toggle, Quick C++ Symbols & Snippets, and keyboard minimize
 * - No cut-offs in quick action buttons (added responsive scroll padding)
 * - Clear 4-directional cursor navigation keys (Left, Right, Up, Down) for smooth mobile caret control
 * - Full touch QWERTY with ?123 symbols toggle, Caps, TAB, Enter, Backspace, Del, and Space
 * - Tactile haptic feedback & retro PC speaker click
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Monitor,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Delete
} from 'lucide-react';
import { hapticService } from '../utils/hapticService';
import { pcSpeaker } from '../utils/soundEngine';

interface VirtualKeyboardProps {
  onKeyPress: (key: string, isSpecial?: boolean) => void;
  onShortcut: (shortcut: 'ctrl-f9' | 'alt-f9' | 'alt-x' | 'alt-f5' | 'f2' | 'f3' | 'f10' | 'break') => void;
  height: number;
  opacity: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  isLandscape: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Rapid 1-tap C++ symbols (extended set for fast coding)
const QUICK_SYMBOLS = [
  ';', ':', '"', '\'', '<', '>', '<<', '>>', '(', ')', '{', '}', '[', ']',
  '=', '==', '!=', '<=', '>=', '+', '-', '*', '/', '%', '#', '&', '&&', '|', '||', '!',
  '->', '::', '\\', '.'
];

// High-speed C++ snippet macros with tab-stop placeholders
const QUICK_SNIPPETS = [
  { label: 'cin >> x;', code: 'cin >> x;' },
  { label: 'cout << x;', code: 'cout << x;' },
  { label: 'for (..)', code: 'for (int i = 0; i < n; i++)\n{\n    \n}' },
  { label: 'switch (..)', code: 'switch (choice)\n{\n    case 1:\n        \n        break;\n    default:\n        break;\n}' },
  { label: 'if (..)', code: 'if (condition)\n{\n    \n}' },
  { label: 'while (..)', code: 'while (condition)\n{\n    \n}' },
  { label: 'endl;', code: 'endl;' },
  { label: '#include <', code: '#include <' },
  { label: 'void main()', code: 'void main()\n{\n    \n}' },
  { label: 'clrscr();', code: 'clrscr();' },
  { label: 'getch();', code: 'getch();' },
  { label: 'return 0;', code: 'return 0;' }
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onShortcut,
  height,
  opacity,
  soundEnabled,
  hapticEnabled,
  isLandscape,
  collapsed,
  onToggleCollapse
}) => {
  const [mode, setMode] = useState<'alpha' | 'sym'>('alpha');
  const [isUppercase, setIsUppercase] = useState<boolean>(false);

  // Long-press rapid repeat for Backspace, Delete, and Arrow navigation keys
  const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPointerActionTimeRef = useRef<number>(0);

  const handleKey = useCallback((key: string, isSpecial: boolean = false) => {
    if (soundEnabled) pcSpeaker.click();
    if (hapticEnabled) hapticService.triggerForKey(key, isSpecial);

    let char = key;
    if (!isSpecial && char.length === 1 && /[a-zA-Z]/.test(char)) {
      char = isUppercase ? char.toUpperCase() : char.toLowerCase();
    }

    onKeyPress(char, isSpecial);
  }, [soundEnabled, hapticEnabled, isUppercase, onKeyPress]);

  const stopRepeat = useCallback(() => {
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  const startRepeat = useCallback((key: string, isSpecial: boolean = true, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    stopRepeat();
    lastPointerActionTimeRef.current = Date.now();

    // Trigger first deletion/action immediately
    handleKey(key, isSpecial);

    // After 350ms initial hold, continuously fire every 60ms
    repeatTimerRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(() => {
        handleKey(key, isSpecial);
      }, 60);
    }, 350);
  }, [handleKey, stopRepeat]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => stopRepeat();
  }, [stopRepeat]);

  const handleButtonClick = useCallback((key: string, isSpecial: boolean = false, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    // Prevent synthetic click from double-firing if pointerdown already handled it within 400ms
    if (Date.now() - lastPointerActionTimeRef.current < 400) {
      return;
    }
    handleKey(key, isSpecial);
  }, [handleKey]);

  const handleOutputTap = () => {
    if (soundEnabled) pcSpeaker.click();
    if (hapticEnabled) hapticService.trigger('action');
    onShortcut('alt-f5');
  };

  if (collapsed) {
    return (
      <div
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
        }}
        className="w-full bg-zinc-950 border-t border-zinc-800 px-3 py-1.5 flex items-center justify-between text-xs text-zinc-400 shrink-0 select-none"
      >
        <button
          onClick={handleOutputTap}
          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white rounded text-xs font-bold font-dos flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Toggle Output Console (Alt+F5)"
        >
          <Monitor size={12} />
          <span>OUTPUT</span>
        </button>

        <button
          onClick={onToggleCollapse}
          className="px-3 py-1 bg-zinc-850 hover:bg-zinc-750 text-cyan-300 rounded flex items-center gap-1 font-bold text-xs cursor-pointer border border-zinc-700"
        >
          <ChevronUp size={14} />
          <span>Keyboard</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{
        opacity: opacity,
        height: `calc(${height}px + env(safe-area-inset-bottom, 0px))`,
        maxHeight: `calc(${height}px + env(safe-area-inset-bottom, 0px))`,
        minHeight: `calc(${height}px + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
      }}
      className="w-full bg-zinc-950 border-t-2 border-zinc-800 flex flex-col justify-between select-none font-sans overflow-hidden transition-all duration-150 shadow-2xl shrink-0"
    >
      {/* ========================================================
          SINGLE STREAMLINED TOP BAR:
          OUTPUT BUTTON + QUICK C++ SYMBOLS/SNIPPETS + MINIMIZE
          No emojis: clean text badge
          ======================================================== */}
      <div className="px-2 py-1 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        {/* Output Toggle Button */}
        <button
          onClick={handleOutputTap}
          className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white rounded text-xs font-bold font-dos flex items-center gap-1 shrink-0 cursor-pointer shadow-xs border border-purple-500"
          title="View Program Output Console"
        >
          <Monitor size={12} />
          <span>OUTPUT</span>
        </button>

        {/* Rapid C++ Symbols & Snippets Strip with visible smooth horizontal scrollbar */}
        <div className="flex-1 flex items-center gap-1 keyboard-quick-scroll min-w-0 pr-3 pb-0.5">
          <span className="text-[10px] text-cyan-400 bg-zinc-800/90 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 whitespace-nowrap border border-zinc-700">
            Quick:
          </span>
          {QUICK_SYMBOLS.map(sym => (
            <button
              key={sym}
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => handleButtonClick(sym, false, e)}
              className="h-6 min-w-[24px] px-1.5 bg-zinc-800 hover:bg-cyan-900 active:bg-cyan-700 text-cyan-300 font-mono font-bold text-xs rounded border border-zinc-700 flex items-center justify-center shrink-0 cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
            >
              {sym}
            </button>
          ))}
          {QUICK_SNIPPETS.map(snip => (
            <button
              key={snip.label}
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => handleButtonClick(snip.code, false, e)}
              className="h-6 px-2 bg-zinc-800 hover:bg-amber-900 active:bg-amber-700 text-amber-300 font-mono font-bold text-[11px] rounded border border-zinc-700 flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap shadow-2xs"
            >
              {snip.label}
            </button>
          ))}
        </div>

        {/* Minimize Keyboard Chevron */}
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded shrink-0 cursor-pointer"
          title="Minimize Keyboard"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* ========================================================
          KEYPAD MATRIX:
          Row 1: Numbers + Del
          Row 2: TAB + QWERTY Top
          Row 3: CAP + QWERTY Mid + RET
          Row 4: ?123 + QWERTY Bot
          Row 5: Cursor Navigation Keys [ ← ] [ → ] [ SPACE ] [ ↑ ] [ ↓ ]
          ======================================================== */}
      <div className="p-1 flex-1 flex flex-col justify-between gap-1 overflow-hidden">
        {mode === 'alpha' ? (
          <>
            {/* Numbers Row */}
            <div className="flex gap-1 w-full justify-between">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map(k => (
                <button
                  key={k}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => handleButtonClick(k, false, e)}
                  className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-mono font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                >
                  {k}
                </button>
              ))}
              <button
                onPointerDown={(e) => startRepeat('Backspace', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onContextMenu={(e) => e.preventDefault()}
                onClick={(e) => handleButtonClick('Backspace', true, e)}
                className="flex-1 max-w-[42px] h-7 bg-zinc-750 hover:bg-zinc-650 active:bg-zinc-600 text-rose-300 text-xs rounded font-bold cursor-pointer flex items-center justify-center select-none"
                title="Backspace (Hold to delete continuously)"
              >
                <Delete size={14} />
              </button>
            </div>

            {/* QWERTY Row 1 */}
            <div className="flex gap-1 w-full justify-between">
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => handleButtonClick('Tab', true, e)}
                className="flex-1 max-w-[38px] h-7 bg-zinc-850 hover:bg-zinc-750 text-cyan-300 font-bold text-[10px] rounded border border-zinc-750 cursor-pointer flex items-center justify-center"
                title="Tab (Indent / Outdent)"
              >
                TAB
              </button>
              {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'].map(k => (
                <button
                  key={k}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => handleButtonClick(k, false, e)}
                  className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-mono font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                >
                  {isUppercase ? k.toUpperCase() : k}
                </button>
              ))}
            </div>

            {/* QWERTY Row 2 */}
            <div className="flex gap-1 w-full justify-between">
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (hapticEnabled) hapticService.trigger('modifier');
                  setIsUppercase(!isUppercase);
                }}
                className={`flex-1 max-w-[38px] h-7 font-bold text-xs rounded cursor-pointer flex items-center justify-center transition-colors ${
                  isUppercase
                    ? 'bg-cyan-600 text-white'
                    : 'bg-zinc-850 hover:bg-zinc-750 text-zinc-300'
                }`}
                title="Toggle Caps"
              >
                {isUppercase ? 'CAP' : 'cap'}
              </button>
              {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''].map(k => (
                <button
                  key={k}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => handleButtonClick(k, false, e)}
                  className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-mono font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                >
                  {isUppercase ? k.toUpperCase() : k}
                </button>
              ))}
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => handleButtonClick('Enter', true, e)}
                className="flex-1 max-w-[48px] h-7 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                title="Enter Return"
              >
                <CornerDownLeft size={13} />
              </button>
            </div>

            {/* QWERTY Row 3: ?123 Switcher + Letters */}
            <div className="flex gap-1 w-full justify-between">
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (hapticEnabled) hapticService.trigger('navigation');
                  setMode('sym');
                }}
                className="flex-1 max-w-[46px] h-7 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-xs rounded border border-blue-400 cursor-pointer flex items-center justify-center"
                title="Switch to Symbols"
              >
                ?123
              </button>
              {['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '#'].map(k => (
                <button
                  key={k}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => handleButtonClick(k, false, e)}
                  className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-mono font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                >
                  {isUppercase ? k.toUpperCase() : k}
                </button>
              ))}
            </div>

            {/* Row 4: Clear Cursor Navigation Keys, Space Bar & DEL Key */}
            <div className="flex gap-1 w-full items-center justify-between">
              {/* Cursor Left */}
              <button
                onPointerDown={(e) => startRepeat('ArrowLeft', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowLeft', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Left (navigate in code)"
              >
                <ArrowLeft size={14} />
              </button>

              {/* Cursor Right */}
              <button
                onPointerDown={(e) => startRepeat('ArrowRight', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowRight', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Right (navigate in code)"
              >
                <ArrowRight size={14} />
              </button>

              {/* Wide Space Bar */}
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => handleButtonClick(' ', false, e)}
                className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs rounded border border-zinc-700 cursor-pointer flex items-center justify-center font-bold tracking-widest shadow-xs"
              >
                SPACE
              </button>

              {/* Forward Delete (DEL) */}
              <button
                onPointerDown={(e) => startRepeat('Delete', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('Delete', true, e)}
                className="w-9 h-7 bg-zinc-800 hover:bg-rose-950 active:bg-rose-900 text-rose-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs font-mono font-bold text-[10px]"
                title="Forward Delete (Del)"
              >
                DEL
              </button>

              {/* Cursor Up */}
              <button
                onPointerDown={(e) => startRepeat('ArrowUp', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowUp', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Up Line (navigate in code)"
              >
                <ArrowUp size={14} />
              </button>

              {/* Cursor Down */}
              <button
                onPointerDown={(e) => startRepeat('ArrowDown', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowDown', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Down Line (navigate in code)"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </>
        ) : (
          /* ================= VIEW 2: SYMBOLS & NUMBERS ================= */
          <>
            <div className="flex gap-1 w-full justify-between">
              {['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'].map(k => (
                <button
                  key={k}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => handleButtonClick(k, false, e)}
                  className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-amber-300 font-mono font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                >
                  {k}
                </button>
              ))}
              <button
                onPointerDown={(e) => startRepeat('Backspace', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onContextMenu={(e) => e.preventDefault()}
                onClick={(e) => handleButtonClick('Backspace', true, e)}
                className="flex-1 max-w-[42px] h-7 bg-zinc-750 hover:bg-zinc-650 active:bg-zinc-600 text-rose-300 text-xs rounded font-bold cursor-pointer flex items-center justify-center select-none"
                title="Backspace (Hold to delete continuously)"
              >
                <Delete size={14} />
              </button>
            </div>

            <div className="flex gap-1 w-full justify-between">
              {['{', '}', '[', ']', '<', '>', '"', '\'', ':', ';', '/', '\\'].map(k => (
                <button
                  key={k}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => handleButtonClick(k, false, e)}
                  className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 text-cyan-200 font-mono font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex gap-1 w-full justify-between">
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => setMode('alpha')}
                className="flex-1 max-w-[48px] h-7 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-xs rounded cursor-pointer flex items-center justify-center"
              >
                ABC
              </button>
              {['~', '`', '|', '?', '=', '+', '-', '*', '%', '^', '&'].map(k => (
                <button
                  key={k}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => handleButtonClick(k, false, e)}
                  className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-mono font-bold text-xs rounded cursor-pointer flex items-center justify-center"
                >
                  {k}
                </button>
              ))}
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => handleButtonClick('Enter', true, e)}
                className="flex-1 max-w-[48px] h-7 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded cursor-pointer flex items-center justify-center"
              >
                <CornerDownLeft size={13} />
              </button>
            </div>

            <div className="flex gap-1 w-full items-center justify-between">
              {/* Cursor Left */}
              <button
                onPointerDown={(e) => startRepeat('ArrowLeft', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowLeft', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Left"
              >
                <ArrowLeft size={14} />
              </button>

              {/* Cursor Right */}
              <button
                onPointerDown={(e) => startRepeat('ArrowRight', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowRight', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Right"
              >
                <ArrowRight size={14} />
              </button>

              {/* Wide Space Bar */}
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => handleButtonClick(' ', false, e)}
                className="flex-1 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs rounded border border-zinc-700 cursor-pointer flex items-center justify-center font-bold tracking-widest shadow-xs"
              >
                SPACE
              </button>

              {/* Forward Delete (DEL) */}
              <button
                onPointerDown={(e) => startRepeat('Delete', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('Delete', true, e)}
                className="w-9 h-7 bg-zinc-800 hover:bg-rose-950 active:bg-rose-900 text-rose-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs font-mono font-bold text-[10px]"
                title="Forward Delete (Del)"
              >
                DEL
              </button>

              {/* Cursor Up */}
              <button
                onPointerDown={(e) => startRepeat('ArrowUp', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowUp', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Up"
              >
                <ArrowUp size={14} />
              </button>

              {/* Cursor Down */}
              <button
                onPointerDown={(e) => startRepeat('ArrowDown', true, e)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onTouchEnd={stopRepeat}
                onTouchCancel={stopRepeat}
                onClick={(e) => handleButtonClick('ArrowDown', true, e)}
                className="w-8 h-7 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded border border-zinc-700 flex items-center justify-center cursor-pointer shadow-xs"
                title="Move Cursor Down"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
