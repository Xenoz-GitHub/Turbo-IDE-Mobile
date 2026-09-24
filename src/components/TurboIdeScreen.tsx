/**
 * Turbo C++ 3.0 Mobile IDE Screen Component
 * Exact 1:1 reproduction of Borland Turbo C++ 3.0 for DOS:
 * - Authentic DOSBox header title bar (DOSBox 0.74, Cpu speed: max 100% cycles...)
 * - System Menu (≡) and all Borland Menus (File, Edit, Search, Run, Compile, Debug, Project, Options, Window, Help)
 * - Complete working actions for all dropdown items (CRUD, search, replace, info, debug, help)
 * - Dynamic bottom status bar that updates help text on hover/selection (F1 Help | <Context Help Description>)
 * - Authentic double-line DOS window frame: ═[■]════ NONAME00.CPP ════1=[↑]═
 * - Fully functional interactive Vertical and Horizontal scrollbars (draggable thumbs, clickable tracks, arrow steppers)
 * - Lightweight Borland C++ syntax highlighting engine with transparent textarea alignment and underscore cursor (_)
 * - Direct-to-Output screen with ANSI/DOS colored text and keypress return
 * - High-fidelity BGI 640x480 EGA/VGA graphics canvas
 * - Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { FolderOpen, ClipboardList, Plus, X, Settings, Play, Menu, ChevronUp } from 'lucide-react';
import { DosFile, VideoScaling } from '../types/emulator';
import { ExecutionEvent, ConsoleOutputSpan } from '../utils/turboCompiler';
import { tokenizeCpp } from '../utils/syntaxHighlighter';
import {
  getLineAndCol,
  computeArrowMove,
  applyKeyMutation,
  computeLineOffsets,
  calculateEnterLineBreakOffset,
  calculateBackspaceOffset,
  calculateDeleteOffset,
  checkBraceBalance,
  BRACKET_PAIRS,
  CLOSING_BRACKETS,
} from '../utils/editorCursorUtils';
import { hapticService } from '../utils/hapticService';
import { TurboOpenFileDialog, FileDialogMode } from './TurboOpenFileDialog';
import { TurboUpdateLogsModal } from './TurboUpdateLogsModal';

interface HelpTopic {
  title: string;
  desc: string;
  example: string;
}

const HELP_TOPICS: HelpTopic[] = [
  {
    title: '#include',
    desc: 'Preprocessor directive to include header files (.h).',
    example: '#include <iostream.h>\n#include <conio.h>'
  },
  {
    title: '#define',
    desc: 'Preprocessor macro definition or symbolic constant.',
    example: '#define MAX_SIZE 100\n#define PI 3.14159'
  },
  {
    title: 'clrscr()',
    desc: 'Clears text-mode console window and resets cursor to (1,1). (conio.h)',
    example: 'clrscr();'
  },
  {
    title: 'cout',
    desc: 'Standard C++ output stream for printing text and variables. (iostream.h)',
    example: 'cout << "The Total salary = " << salary << endl;'
  },
  {
    title: 'cin',
    desc: 'Standard C++ input stream for reading values into variables. (iostream.h)',
    example: 'cin >> salary;\ncin >> grade;'
  },
  {
    title: 'getch()',
    desc: 'Reads a single character directly from console without screen echo. (conio.h)',
    example: 'cout << "Press any key...";\ngetch();'
  },
  {
    title: 'initgraph()',
    desc: 'Initializes the Borland Graphics Interface (BGI) subsystem. (graphics.h)',
    example: 'int gdriver = DETECT, gmode;\ninitgraph(&gdriver, &gmode, "C:\\\\TC\\\\BGI");'
  },
  {
    title: 'circle()',
    desc: 'Draws circle at (x, y) with given radius r using current color. (graphics.h)',
    example: 'setcolor(WHITE);\ncircle(320, 240, 50);'
  },
  {
    title: 'line()',
    desc: 'Draws straight line from (x1, y1) to (x2, y2). (graphics.h)',
    example: 'setcolor(LIGHTCYAN);\nline(20, 50, 20, 300);'
  },
  {
    title: 'outtextxy()',
    desc: 'Displays text string at specified graphics coordinate (x, y). (graphics.h)',
    example: 'outtextxy(25, 20, "Turbo C++ Mobile Graphics");'
  },
  {
    title: 'delay()',
    desc: 'Suspends program execution for specified number of milliseconds. (dos.h)',
    example: 'delay(500); // 500 ms pause'
  },
  {
    title: 'sound()',
    desc: 'Turns on PC speaker frequency generator at given Hertz. (dos.h)',
    example: 'sound(440); // 440 Hz A4 tone\ndelay(200);\nnosound();'
  },
  {
    title: 'nosound()',
    desc: 'Turns off PC speaker sound generation. (dos.h)',
    example: 'nosound();'
  },
  {
    title: 'textcolor()',
    desc: 'Selects foreground character color in text window (0-15). (conio.h)',
    example: 'textcolor(YELLOW);\ncprintf("Colored DOS text");'
  },
  {
    title: 'textbackground()',
    desc: 'Selects background color for text window (0-7). (conio.h)',
    example: 'textbackground(BLUE);'
  },
  {
    title: 'gotoxy()',
    desc: 'Positions cursor at column x, row y on screen. (conio.h)',
    example: 'gotoxy(10, 5);'
  },
  {
    title: 'closegraph()',
    desc: 'Shuts down graphics system and restores original screen mode. (graphics.h)',
    example: 'closegraph();'
  }
];

interface TurboIdeScreenProps {
  currentFile?: DosFile | null;
  allFiles?: DosFile[];
  onSelectFile?: (file: DosFile) => void;
  onCodeChange: (newCode: string) => void;
  videoScaling: VideoScaling;
  crtScanlines: boolean;
  isCompiling: boolean;
  isCompiled?: boolean;
  compileDialog: {
    visible: boolean;
    fileName: string;
    linesCompiled: number;
    errors: string[];
    warnings: string[];
    success: boolean;
  } | null;
  onCloseCompileDialog: () => void;
  activeScreenMode: 'ide' | 'output' | 'graphics';
  onSwitchScreenMode: (mode: 'ide' | 'output' | 'graphics') => void;
  outputBuffer: string[];
  outputSpans?: ConsoleOutputSpan[];
  executionEvents: ExecutionEvent[];
  trackpadMode: boolean;
  onRunAction: () => void;
  onCompileAction: () => void;
  onSaveAction: () => void;
  onOpenAction: () => void;
  onCreateFileAction?: () => void;
  onDeleteFileAction?: (fileId: string) => void;
  isWaitingForInput?: boolean;
  currentInputText?: string;
  isExecutionFinished?: boolean;
  onInputChange?: (val: string) => void;
  onSubmitInput?: () => void;
  onBreakAction?: () => void;
  onEditorFocus?: () => void;
}

interface MenuItemDef {
  label: string;
  hotkeyChar: string;
  shortcut?: string;
  disabled?: boolean;
  isDivider?: boolean;
  helpText: string;
  action?: () => void;
}

interface MenuDef {
  id: string;
  label: string;
  hotkeyChar: string;
  defaultHelp: string;
  items: MenuItemDef[];
}

export const TurboIdeScreen: React.FC<TurboIdeScreenProps> = ({
  currentFile,
  allFiles = [],
  onSelectFile,
  onCodeChange,
  videoScaling,
  crtScanlines,
  isCompiling,
  isCompiled = true,
  compileDialog,
  onCloseCompileDialog,
  activeScreenMode,
  onSwitchScreenMode,
  outputBuffer,
  outputSpans = [],
  executionEvents,
  trackpadMode,
  onRunAction,
  onCompileAction,
  onSaveAction,
  onOpenAction,
  onCreateFileAction,
  onDeleteFileAction,
  isWaitingForInput = false,
  currentInputText = '',
  isExecutionFinished = false,
  onInputChange,
  onSubmitInput,
  onBreakAction,
  onEditorFocus,
}) => {
  const consoleInputRef = useRef<HTMLInputElement>(null);
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll console output to bottom as new text streams in or inputs occur
  useEffect(() => {
    if (activeScreenMode === 'output' && consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [activeScreenMode, outputSpans, outputBuffer, isWaitingForInput, currentInputText]);

  // Click-to-Line compiler error highlight state
  const [errorHighlightLine, setErrorHighlightLine] = useState<number | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus input field on mobile or desktop whenever input is requested
  useEffect(() => {
    if (activeScreenMode === 'output' && isWaitingForInput) {
      consoleInputRef.current?.focus();
    }
  }, [activeScreenMode, isWaitingForInput]);
  // Cursor position (Line & Column)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Active Menu Dropdown & Hovered Item for dynamic status bar
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [hoveredHelpText, setHoveredHelpText] = useState<string | null>(null);

  // Sub-dialog states for full functionality
  const [showOpenDialog, setShowOpenDialog] = useState<boolean>(false);
  const [fileDialogMode, setFileDialogMode] = useState<FileDialogMode>('open');
  const [showFindDialog, setShowFindDialog] = useState<boolean>(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState<boolean>(false);
  const [showInfoDialog, setShowInfoDialog] = useState<boolean>(false);
  const [showHelpDialog, setShowHelpDialog] = useState<boolean>(false);
  const [selectedHelpTopic, setSelectedHelpTopic] = useState<HelpTopic | null>(null);
  const [showAboutDialog, setShowAboutDialog] = useState<boolean>(false);
  const [showUpdateLogs, setShowUpdateLogs] = useState<boolean>(false);
  const [showEvalDialog, setShowEvalDialog] = useState<boolean>(false);

  // DOS Mouse/Trackpad mode pointer state
  const [mousePos, setMousePos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 120,
    y: 120,
    visible: false
  });

  // Split Message Window (Image 3 & Image 4)
  const [showMessageWindow, setShowMessageWindow] = useState<boolean>(false);
  const [isMessageMaximized, setIsMessageMaximized] = useState<boolean>(false);
  const [compileErrors, setCompileErrors] = useState<string[]>([]);
  const [activeErrorIndex, setActiveErrorIndex] = useState<number>(0);

  // Search & Replace state
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [evalInput, setEvalInput] = useState('2 + 2 * 10');
  const [evalOutput, setEvalOutput] = useState('22');

  // Multi-window cascading view toggle (Screenshot 10)
  const [isCascadedView, setIsCascadedView] = useState<boolean>(false);
  const [activeWindowNum, setActiveWindowNum] = useState<number>(1);

  // Dynamic Cursor state (White default, vibrant orange on hover, bold red/orange on click/typing)
  const [cursorInteractionState, setCursorInteractionState] = useState<'normal' | 'hover' | 'active'>('normal');

  const dynamicCaretColor = useMemo(() => {
    if (cursorInteractionState === 'active') return '#FF3300'; // Bold red/orange on click & active typing
    if (cursorInteractionState === 'hover') return '#FFAA00'; // Vibrant orange on hover
    return '#FFFFFF'; // Original crisp white DOS cursor
  }, [cursorInteractionState]);

  // Synchronize compile errors to message window
  useEffect(() => {
    if (compileDialog?.errors && compileDialog.errors.length > 0) {
      setCompileErrors(compileDialog.errors);
      setActiveErrorIndex(0);
      setShowMessageWindow(true);
    }
  }, [compileDialog]);

  // Edge-by-edge resizable container dimensions
  const [ideSize, setIdeSize] = useState<{ width: number; height: number; isMaximized: boolean }>({
    width: 840,
    height: 540,
    isMaximized: true
  });
  const [resizingEdge, setResizingEdge] = useState<'n' | 's' | 'e' | 'w' | 'se' | null>(null);
  const startDragRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({
    startX: 0,
    startY: 0,
    startW: 840,
    startH: 540
  });

  // Scroll tracking for single authentic DOS scrollbars
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(100);
  const [clientHeight, setClientHeight] = useState(100);
  const [scrollWidth, setScrollWidth] = useState(100);
  const [clientWidth, setClientWidth] = useState(100);

  // Scrollbar dragging states
  const [isDraggingVThumb, setIsDraggingVThumb] = useState(false);
  const [isDraggingHThumb, setIsDraggingHThumb] = useState(false);
  const dragStartPosRef = useRef({ mousePos: 0, scrollStart: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeViewerRef = useRef<HTMLDivElement>(null);
  const graphicsCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vTrackRef = useRef<HTMLDivElement>(null);
  const hTrackRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll between textarea and viewer
  const handleScroll = useCallback(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    setScrollTop(el.scrollTop);
    setScrollLeft(el.scrollLeft);
    setScrollHeight(el.scrollHeight);
    setClientHeight(el.clientHeight);
    setScrollWidth(el.scrollWidth);
    setClientWidth(el.clientWidth);

    if (codeViewerRef.current) {
      codeViewerRef.current.scrollTop = el.scrollTop;
      codeViewerRef.current.scrollLeft = el.scrollLeft;
    }
  }, []);

  // Exact selection anchor ref so cursor position never desynchronizes during typing or backspace
  const cursorSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Controlled code buffer logic state - decoupled from display layer and parent props
  const [codeBuffer, setCodeBuffer] = useState<string>(currentFile?.content || '');
  const activeFileIdRef = useRef<string | null>(currentFile?.id || null);

  // Synchronize codeBuffer when switching files or when external changes occur
  useEffect(() => {
    if (currentFile && currentFile.id !== activeFileIdRef.current) {
      activeFileIdRef.current = currentFile.id;
      setCodeBuffer(currentFile.content);
      cursorSelectionRef.current = { start: 0, end: 0 };
      if (textareaRef.current) {
        textareaRef.current.value = currentFile.content;
        textareaRef.current.setSelectionRange(0, 0);
      }
      setCursorPos({ line: 1, col: 1 });
    } else if (
      currentFile &&
      currentFile.content !== codeBuffer &&
      document.activeElement !== textareaRef.current
    ) {
      setCodeBuffer(currentFile.content);
    }
  }, [currentFile?.id, currentFile?.content]);

  // Memoized line offsets lookup array for high-speed deterministic line/col indexing
  const lineOffsets = useMemo(() => computeLineOffsets(codeBuffer), [codeBuffer]);

  // Decoupled Display Layer: syntax highlighted tokens derived directly from codeBuffer
  const highlightedTokens = useMemo(() => {
    if (!codeBuffer) return [];
    return tokenizeCpp(codeBuffer);
  }, [codeBuffer]);

  // Unmatched Bracket Pre-Check for defensive coding feedback
  const braceBalance = useMemo(() => checkBraceBalance(codeBuffer), [codeBuffer]);

  // Smoothly scroll editor container to ensure the active cursor position stays visible
  const scrollCursorIntoView = useCallback((charIdx: number) => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value;
    const safeIdx = Math.max(0, Math.min(charIdx, text.length));
    const linesBefore = text.slice(0, safeIdx).split(/\r?\n/);
    const lineIndex = linesBefore.length - 1;
    const colIndex = linesBefore[lineIndex].length;

    const LINE_HEIGHT = 20; // 20px leading-5
    const CHAR_WIDTH = 7.2; // approx monospace char width
    const PADDING = 8; // p-2 is 8px

    const cursorY = PADDING + lineIndex * LINE_HEIGHT;
    const cursorX = PADDING + colIndex * CHAR_WIDTH;

    if (cursorY < el.scrollTop + PADDING) {
      el.scrollTop = Math.max(0, cursorY - PADDING);
    } else if (cursorY + LINE_HEIGHT > el.scrollTop + el.clientHeight - PADDING) {
      el.scrollTop = cursorY + LINE_HEIGHT - el.clientHeight + PADDING;
    }

    if (cursorX < el.scrollLeft + PADDING) {
      el.scrollLeft = Math.max(0, cursorX - PADDING);
    } else if (cursorX + CHAR_WIDTH > el.scrollLeft + el.clientWidth - PADDING) {
      el.scrollLeft = cursorX + CHAR_WIDTH - el.clientWidth + PADDING + 30;
    }

    handleScroll();
  }, [handleScroll]);

  // Commit buffer change helper: updates logic state, DOM textarea, parent file state, and cursor
  const commitBufferChange = useCallback((newCode: string, newStart: number, newEnd: number) => {
    cursorSelectionRef.current = { start: newStart, end: newEnd };
    setCodeBuffer(newCode);
    onCodeChange(newCode);
    if (textareaRef.current) {
      textareaRef.current.value = newCode;
      textareaRef.current.setSelectionRange(newStart, newEnd);
    }
    const offsets = computeLineOffsets(newCode);
    const { line, col } = getLineAndCol(newCode, newStart, offsets);
    setCursorPos({ line, col });
    scrollCursorIntoView(newStart);
  }, [onCodeChange, scrollCursorIntoView]);

  // Helper to reliably retrieve editor selection whether textarea has focus or not (e.g. during touch keyboard interaction)
  const getEditorSelection = useCallback(() => {
    const el = textareaRef.current;
    const isFocused = document.activeElement === el;
    let start = cursorSelectionRef.current.start;
    let end = cursorSelectionRef.current.end;
    if (el && isFocused && typeof el.selectionStart === 'number' && el.selectionStart >= 0) {
      start = el.selectionStart;
      end = typeof el.selectionEnd === 'number' && el.selectionEnd >= 0 ? el.selectionEnd : start;
    }
    const safeStart = Math.min(Math.max(0, start), codeBuffer.length);
    const safeEnd = Math.min(Math.max(0, end), codeBuffer.length);
    return { start: Math.min(safeStart, safeEnd), end: Math.max(safeStart, safeEnd) };
  }, [codeBuffer.length]);

  // Granular Enter key handler: ensures correct newline character insertion and cursor movement in state buffer
  const handleExplicitEnter = useCallback(() => {
    const { start, end } = getEditorSelection();
    const res = calculateEnterLineBreakOffset(codeBuffer, start, end);
    commitBufferChange(res.nextVal, res.newStart, res.newEnd);
  }, [codeBuffer, commitBufferChange, getEditorSelection]);

  // Granular Backspace key handler: deletes preceding character within state buffer and updates cursor index
  const handleExplicitBackspace = useCallback(() => {
    const { start, end } = getEditorSelection();
    const res = calculateBackspaceOffset(codeBuffer, start, end);
    commitBufferChange(res.nextVal, res.newStart, res.newEnd);
  }, [codeBuffer, commitBufferChange, getEditorSelection]);

  // Explicit Delete key handler: calculates forward deletion offset manually
  const handleExplicitDelete = useCallback(() => {
    const { start, end } = getEditorSelection();
    const res = calculateDeleteOffset(codeBuffer, start, end);
    commitBufferChange(res.nextVal, res.newStart, res.newEnd);
  }, [codeBuffer, commitBufferChange, getEditorSelection]);

  // Explicit Tab / Shift+Tab key handler
  const handleExplicitTab = useCallback((shiftKey: boolean) => {
    const { start, end } = getEditorSelection();

    if (shiftKey) {
      // Shift+Tab: Unindent
      const lineStartPos = codeBuffer.lastIndexOf('\n', start - 1) + 1;
      const lineEndPos = codeBuffer.indexOf('\n', end);
      const actualEndPos = lineEndPos === -1 ? codeBuffer.length : lineEndPos;
      const selectedBlock = codeBuffer.slice(lineStartPos, actualEndPos);
      const lines = selectedBlock.split('\n');
      let removedChars = 0;
      const unindented = lines.map(line => {
        const removeCount = Math.min(4, line.search(/\S|$/));
        removedChars += removeCount;
        return line.slice(removeCount);
      }).join('\n');
      const nextVal = codeBuffer.slice(0, lineStartPos) + unindented + codeBuffer.slice(actualEndPos);
      const newStart = Math.max(lineStartPos, start - 4);
      const newEnd = Math.max(lineStartPos, end - removedChars);
      commitBufferChange(nextVal, newStart, newEnd);
    } else {
      // Regular Tab / Indent
      const res = applyKeyMutation(codeBuffer, start, end, 'Tab', true);
      commitBufferChange(res.nextVal, res.newStart, res.newEnd);
    }
  }, [codeBuffer, commitBufferChange, getEditorSelection]);

  // Jump to error line helper with visual line flash highlight
  const jumpToErrorLine = useCallback((errText: string) => {
    if (!textareaRef.current) return;
    const match = errText.match(/\s+(\d+):/) || errText.match(/line\s+(\d+)/i) || errText.match(/:(\d+)/) || errText.match(/\((\d+)\)/);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      const targetLineIdx = Math.min(Math.max(0, lineNum - 1), lineOffsets.length - 1);
      const charPos = lineOffsets[targetLineIdx] ?? 0;
      textareaRef.current.setSelectionRange(charPos, charPos);
      textareaRef.current.focus();
      cursorSelectionRef.current = { start: charPos, end: charPos };
      const { col } = getLineAndCol(codeBuffer, charPos, lineOffsets);
      setCursorPos({ line: lineNum, col });
      scrollCursorIntoView(charPos);

      // Flash highlight line for 3 seconds
      setErrorHighlightLine(lineNum);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setErrorHighlightLine(null);
      }, 3000);
    }
  }, [codeBuffer, lineOffsets, scrollCursorIntoView]);

  // Update line and column indicator on cursor change with authentic tab expansion
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const pos = el.selectionStart ?? 0;
    const endPos = el.selectionEnd ?? pos;
    cursorSelectionRef.current = { start: pos, end: endPos };
    const { line, col } = getLineAndCol(codeBuffer, pos, lineOffsets);
    setCursorPos({ line, col });
  }, [codeBuffer, lineOffsets]);

  // Resize handler
  const handleStartResize = (edge: 'n' | 's' | 'e' | 'w' | 'se', e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticService.trigger('navigation');
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startDragRef.current = {
      startX: clientX,
      startY: clientY,
      startW: ideSize.width,
      startH: ideSize.height
    };
    setResizingEdge(edge);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!resizingEdge) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - startDragRef.current.startX;
      const deltaY = clientY - startDragRef.current.startY;

      setIdeSize(prev => {
        let newW = prev.width;
        let newH = prev.height;

        if (resizingEdge === 'e' || resizingEdge === 'se') {
          newW = Math.max(340, Math.min(window.innerWidth - 10, startDragRef.current.startW + deltaX));
        } else if (resizingEdge === 'w') {
          newW = Math.max(340, Math.min(window.innerWidth - 10, startDragRef.current.startW - deltaX));
        }

        if (resizingEdge === 's' || resizingEdge === 'se') {
          newH = Math.max(260, Math.min(window.innerHeight - 80, startDragRef.current.startH + deltaY));
        } else if (resizingEdge === 'n') {
          newH = Math.max(260, Math.min(window.innerHeight - 80, startDragRef.current.startH - deltaY));
        }

        return { ...prev, width: newW, height: newH, isMaximized: false };
      });
    };

    const handleEnd = () => {
      if (resizingEdge) setResizingEdge(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [resizingEdge]);

  // Click outside to close active menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (activeMenuId && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
        setHoveredHelpText(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeMenuId]);

  // DOS Functional Scrollbar Steppers (▲, ▼, ◄, ►)
  const scrollByDelta = (dx: number, dy: number) => {
    if (!textareaRef.current) return;
    hapticService.trigger('navigation');
    textareaRef.current.scrollTop += dy;
    textareaRef.current.scrollLeft += dx;
    handleScroll();
  };

  // Vertical Track Click / Tap
  const handleVerticalTrackClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!textareaRef.current || !vTrackRef.current) return;
    const rect = vTrackRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clickY = clientY - rect.top;
    const percent = Math.max(0, Math.min(1, clickY / rect.height));
    textareaRef.current.scrollTop = percent * (textareaRef.current.scrollHeight - textareaRef.current.clientHeight);
    handleScroll();
  };

  // Horizontal Track Click / Tap
  const handleHorizontalTrackClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!textareaRef.current || !hTrackRef.current) return;
    const rect = hTrackRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    textareaRef.current.scrollLeft = percent * (textareaRef.current.scrollWidth - textareaRef.current.clientWidth);
    handleScroll();
  };

  // Vertical Thumb Dragging (Mouse & Touch)
  const handleStartVThumbDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!textareaRef.current) return;
    setIsDraggingVThumb(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartPosRef.current = {
      mousePos: clientY,
      scrollStart: textareaRef.current.scrollTop
    };
  };

  // Horizontal Thumb Dragging (Mouse & Touch)
  const handleStartHThumbDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!textareaRef.current) return;
    setIsDraggingHThumb(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartPosRef.current = {
      mousePos: clientX,
      scrollStart: textareaRef.current.scrollLeft
    };
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (isDraggingVThumb && textareaRef.current && vTrackRef.current) {
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - dragStartPosRef.current.mousePos;
        const trackH = vTrackRef.current.clientHeight;
        const maxScroll = textareaRef.current.scrollHeight - textareaRef.current.clientHeight;
        if (trackH > 0 && maxScroll > 0) {
          const scrollDelta = (deltaY / trackH) * maxScroll;
          textareaRef.current.scrollTop = dragStartPosRef.current.scrollStart + scrollDelta;
          handleScroll();
        }
      }

      if (isDraggingHThumb && textareaRef.current && hTrackRef.current) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - dragStartPosRef.current.mousePos;
        const trackW = hTrackRef.current.clientWidth;
        const maxScroll = textareaRef.current.scrollWidth - textareaRef.current.clientWidth;
        if (trackW > 0 && maxScroll > 0) {
          const scrollDelta = (deltaX / trackW) * maxScroll;
          textareaRef.current.scrollLeft = dragStartPosRef.current.scrollStart + scrollDelta;
          handleScroll();
        }
      }
    };

    const handleDragEnd = () => {
      setIsDraggingVThumb(false);
      setIsDraggingHThumb(false);
    };

    if (isDraggingVThumb || isDraggingHThumb) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDraggingVThumb, isDraggingHThumb, handleScroll]);

  // Listen for cursor-aware virtual keyboard typing and navigation events
  useEffect(() => {
    const handleKeyInsert = (e: Event) => {
      const custom = e as CustomEvent<{ key: string; isSpecial: boolean }>;
      if (!custom.detail) return;
      const { key, isSpecial } = custom.detail;
      const el = textareaRef.current;
      if (!el || !currentFile) {
        if (!isSpecial && currentFile) {
          commitBufferChange(codeBuffer + key, codeBuffer.length + key.length, codeBuffer.length + key.length);
        }
        return;
      }

      setCursorInteractionState('active');

      if (key === 'Enter') {
        handleExplicitEnter();
        return;
      }
      if (key === 'Backspace') {
        handleExplicitBackspace();
        return;
      }
      if (key === 'Delete') {
        handleExplicitDelete();
        return;
      }
      if (key === 'Tab') {
        handleExplicitTab(false);
        return;
      }

      // Single source of truth: cursorSelectionRef clamped to valid range
      const isFocused = document.activeElement === el;
      let curStart = cursorSelectionRef.current.start;
      let curEnd = cursorSelectionRef.current.end;

      if (isFocused && typeof el.selectionStart === 'number' && el.selectionStart >= 0) {
        curStart = el.selectionStart;
        curEnd = typeof el.selectionEnd === 'number' && el.selectionEnd >= 0 ? el.selectionEnd : curStart;
      }

      curStart = Math.min(Math.max(0, curStart), codeBuffer.length);
      curEnd = Math.min(Math.max(0, curEnd), codeBuffer.length);

      if (key.startsWith('Arrow')) {
        const newPos = computeArrowMove(
          codeBuffer,
          curStart,
          curEnd,
          key as 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
        );
        cursorSelectionRef.current = { start: newPos, end: newPos };
        el.setSelectionRange(newPos, newPos);
        const { line, col } = getLineAndCol(codeBuffer, newPos, lineOffsets);
        setCursorPos({ line, col });
        scrollCursorIntoView(newPos);
        return;
      }

      const { nextVal, newStart, newEnd } = applyKeyMutation(codeBuffer, curStart, curEnd, key, isSpecial);
      commitBufferChange(nextVal, newStart, newEnd);
    };

    window.addEventListener('turbo-insert-key', handleKeyInsert);
    return () => window.removeEventListener('turbo-insert-key', handleKeyInsert);
  }, [
    codeBuffer,
    currentFile,
    handleExplicitEnter,
    handleExplicitBackspace,
    handleExplicitDelete,
    handleExplicitTab,
    commitBufferChange,
    lineOffsets,
    scrollCursorIntoView
  ]);

  // Dedicated granular event listeners for 'Enter' and 'Backspace' inside the code editor component
  useEffect(() => {
    const handleGranularEnter = (e: Event) => {
      e.stopPropagation();
      setCursorInteractionState('active');
      handleExplicitEnter();
    };

    const handleGranularBackspace = (e: Event) => {
      e.stopPropagation();
      setCursorInteractionState('active');
      handleExplicitBackspace();
    };

    window.addEventListener('turbo-editor-enter', handleGranularEnter);
    window.addEventListener('turbo-editor-backspace', handleGranularBackspace);

    return () => {
      window.removeEventListener('turbo-editor-enter', handleGranularEnter);
      window.removeEventListener('turbo-editor-backspace', handleGranularBackspace);
    };
  }, [handleExplicitEnter, handleExplicitBackspace]);

  // Synchronize textarea selection range and syntax highlighter scroll across React renders
  useLayoutEffect(() => {
    if (textareaRef.current) {
      const { start, end } = cursorSelectionRef.current;
      const len = textareaRef.current.value.length;
      const safeStart = Math.min(Math.max(0, start), len);
      const safeEnd = Math.min(Math.max(0, end), len);
      if (
        textareaRef.current.selectionStart !== safeStart ||
        textareaRef.current.selectionEnd !== safeEnd
      ) {
        textareaRef.current.setSelectionRange(safeStart, safeEnd);
      }
    }
    // Lock syntax highlight overlay scroll to textarea scroll so children replacement never resets scroll
    if (codeViewerRef.current && textareaRef.current) {
      codeViewerRef.current.scrollTop = textareaRef.current.scrollTop;
      codeViewerRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [codeBuffer, highlightedTokens]);

  // Calculate Scrollbar Thumb Metrics
  const maxVScroll = Math.max(1, scrollHeight - clientHeight);
  const maxHScroll = Math.max(1, scrollWidth - clientWidth);
  const vThumbRatio = Math.max(0.1, Math.min(1, clientHeight / Math.max(1, scrollHeight)));
  const hThumbRatio = Math.max(0.1, Math.min(1, clientWidth / Math.max(1, scrollWidth)));
  const vThumbPercent = (scrollTop / maxVScroll) * (100 - vThumbRatio * 100);
  const hThumbPercent = (scrollLeft / maxHScroll) * (100 - hThumbRatio * 100);

  // Search in File helper
  const handleFindNext = (query: string) => {
    if (!query || !textareaRef.current) return;
    const text = textareaRef.current.value;
    const curIdx = textareaRef.current.selectionEnd || 0;
    let nextIdx = text.toLowerCase().indexOf(query.toLowerCase(), curIdx);
    if (nextIdx === -1) {
      nextIdx = text.toLowerCase().indexOf(query.toLowerCase(), 0);
    }
    if (nextIdx !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextIdx, nextIdx + query.length);
      handleSelect();
      hapticService.trigger('action');
    } else {
      alert(`Search string '${query}' not found.`);
    }
  };

  // Replace helper
  const handleReplaceAll = (from: string, to: string) => {
    if (!from || !currentFile) return;
    const newContent = codeBuffer.split(from).join(to);
    commitBufferChange(newContent, 0, 0);
    setShowReplaceDialog(false);
    alert(`Replaced all occurrences of '${from}' with '${to}'.`);
  };

  // Jump to line helper
  const handleGoToLine = () => {
    if (!currentFile) return;
    const lineStr = prompt('Go to line number:', '1');
    if (!lineStr || !textareaRef.current) return;
    const targetLine = parseInt(lineStr, 10);
    if (isNaN(targetLine) || targetLine < 1) return;

    const targetIdx = Math.min(targetLine - 1, lineOffsets.length - 1);
    const charOffset = lineOffsets[targetIdx] ?? 0;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset);
    cursorSelectionRef.current = { start: charOffset, end: charOffset };
    handleSelect();
    textareaRef.current.scrollTop = Math.max(0, (targetLine - 5) * 20);
    handleScroll();
  };

  // Clipboard operations
  const handleCopy = async () => {
    if (!textareaRef.current) return;
    const sel = codeBuffer.substring(
      textareaRef.current.selectionStart,
      textareaRef.current.selectionEnd
    );
    if (sel && navigator.clipboard) {
      await navigator.clipboard.writeText(sel);
      hapticService.trigger('action');
    }
  };

  const handleCut = async () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const sel = codeBuffer.substring(start, end);
    if (sel) {
      if (navigator.clipboard) await navigator.clipboard.writeText(sel);
      const nextVal = codeBuffer.slice(0, start) + codeBuffer.slice(end);
      commitBufferChange(nextVal, start, start);
      hapticService.trigger('action');
    }
  };

  const handlePaste = async () => {
    if (!textareaRef.current || !navigator.clipboard) return;
    try {
      const clipText = await navigator.clipboard.readText();
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const nextVal = codeBuffer.slice(0, start) + clipText + codeBuffer.slice(end);
      const newPos = start + clipText.length;
      commitBufferChange(nextVal, newPos, newPos);
      hapticService.trigger('action');
    } catch {
      alert('Clipboard access restricted. Use on-screen keyboard or paste directly.');
    }
  };

  // BGI graphics rendering loop
  useEffect(() => {
    if (activeScreenMode !== 'graphics' || !graphicsCanvasRef.current) return;
    const canvas = graphicsCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vgaColors = [
      '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
      '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
    ];

    executionEvents.forEach(evt => {
      const col = vgaColors[(evt.color || 15) % 16];
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 2;

      if (evt.kind === 'draw_circle' && evt.x !== undefined && evt.y !== undefined && evt.r !== undefined) {
        ctx.beginPath();
        ctx.arc(evt.x, evt.y, evt.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (evt.kind === 'draw_line' && evt.x !== undefined && evt.y !== undefined && evt.x2 !== undefined && evt.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(evt.x, evt.y);
        ctx.lineTo(evt.x2, evt.y2);
        ctx.stroke();
      } else if (evt.kind === 'draw_rect' && evt.x !== undefined && evt.y !== undefined && evt.x2 !== undefined && evt.y2 !== undefined) {
        ctx.strokeRect(evt.x, evt.y, evt.x2 - evt.x, evt.y2 - evt.y);
      } else if (evt.kind === 'draw_bar' && evt.x !== undefined && evt.y !== undefined && evt.x2 !== undefined && evt.y2 !== undefined) {
        ctx.fillRect(evt.x, evt.y, evt.x2 - evt.x, evt.y2 - evt.y);
      } else if (evt.kind === 'draw_text' && evt.x !== undefined && evt.y !== undefined && evt.text) {
        ctx.font = '16px monospace';
        ctx.fillText(evt.text, evt.x, evt.y);
      }
    });
  }, [activeScreenMode, executionEvents]);

  // ========================================================
  // ALL 11 BORLAND MENUS WITH FULL FUNCTIONAL ACTIONS
  // ========================================================
  const MENUS: MenuDef[] = useMemo(() => [
    {
      id: 'system',
      label: '≡',
      hotkeyChar: '≡',
      defaultHelp: 'Redraw screen, compiler options, help, and windows',
      items: [
        {
          label: 'Repaint desktop',
          hotkeyChar: 'R',
          helpText: 'Redraw the screen and reset layout',
          action: () => {
            setActiveMenuId(null);
            hapticService.trigger('primary');
            setIdeSize({ width: 840, height: 540, isMaximized: true });
          }
        },
        {
          label: 'Clear Screen',
          hotkeyChar: 'C',
          helpText: 'Clear text or graphics output buffers',
          action: () => {
            setActiveMenuId(null);
            onCodeChange('');
          }
        },
        {
          label: 'Message window',
          hotkeyChar: 'M',
          helpText: 'Toggle split compiler Message window (Image 3 & 4)',
          action: () => {
            setActiveMenuId(null);
            setShowMessageWindow(prev => !prev);
          }
        },
        {
          label: 'Output Screen',
          hotkeyChar: 'O',
          helpText: 'Direct to DOS Output Console Window',
          action: () => {
            setActiveMenuId(null);
            onSwitchScreenMode(activeScreenMode === 'output' ? 'ide' : 'output');
          }
        },
        {
          label: 'Compiler Options...',
          hotkeyChar: 'P',
          helpText: 'Set compiler code generation and optimization models',
          action: () => {
            setActiveMenuId(null);
            alert('Borland C++ 3.0 Compiler: Memory Model = SMALL, 8086/80286 instruction set active.');
          }
        },
        {
          label: 'Environment...',
          hotkeyChar: 'E',
          helpText: 'Configure CRT scanlines, display colors, and desktop',
          action: () => {
            setActiveMenuId(null);
            alert('Environment: Borland 80x25 EGA/VGA text mode with 16 authentic hardware colors.');
          }
        },
        {
          label: 'Update logs...',
          hotkeyChar: 'U',
          helpText: 'Display release notes and recent update logs',
          action: () => {
            setActiveMenuId(null);
            setShowUpdateLogs(true);
          }
        },
        {
          label: 'Help Topics...',
          hotkeyChar: 'H',
          helpText: 'Display Help table of contents and C++ manual',
          action: () => {
            setActiveMenuId(null);
            setShowHelpDialog(true);
          }
        },
        {
          label: 'About Borland TC...',
          hotkeyChar: 'A',
          helpText: 'About Turbo C++ Mobile & ENCRYPTED CREW',
          action: () => {
            setActiveMenuId(null);
            setShowAboutDialog(true);
          }
        }
      ]
    },
    {
      id: 'file',
      label: 'File',
      hotkeyChar: 'F',
      defaultHelp: 'File management (New, Open, Save, Print, etc.)',
      items: [
        {
          label: 'New',
          hotkeyChar: 'N',
          helpText: 'Create a new file in a new Edit window',
          action: () => {
            setActiveMenuId(null);
            if (onCreateFileAction) onCreateFileAction();
          }
        },
        {
          label: 'Open...',
          hotkeyChar: 'O',
          helpText: 'Locate and open a file in the workspace via File Manager',
          action: () => {
            setActiveMenuId(null);
            onOpenAction();
          }
        },
        {
          label: 'Save',
          hotkeyChar: 'S',
          helpText: 'Save file to DOS workspace and phone storage',
          action: () => {
            setActiveMenuId(null);
            onSaveAction();
          }
        },
        {
          label: 'Save as...',
          hotkeyChar: 'A',
          helpText: 'Save current file under a different name (Save File As)',
          action: () => {
            setActiveMenuId(null);
            setFileDialogMode('save_as');
            setShowOpenDialog(true);
          }
        },
        {
          label: 'Save all',
          hotkeyChar: 'v',
          helpText: 'Save all modified files in workspace',
          action: () => {
            setActiveMenuId(null);
            onSaveAction();
          }
        },
        { isDivider: true, label: '', hotkeyChar: '', helpText: '' },
        {
          label: 'Print',
          hotkeyChar: 'P',
          helpText: 'Print contents of active edit window',
          action: () => {
            setActiveMenuId(null);
            window.print();
          }
        },
        {
          label: 'DOS shell',
          hotkeyChar: 'D',
          helpText: 'Temporarily exit to DOS prompt console',
          action: () => {
            setActiveMenuId(null);
            onSwitchScreenMode('output');
          }
        },
        {
          label: 'Quit',
          hotkeyChar: 'x',
          shortcut: 'Alt+X',
          helpText: 'Exit Turbo C++ and return to shell',
          action: () => {
            setActiveMenuId(null);
            if (confirm('Exit Turbo C++ and switch to DOS Output screen?')) {
              onSwitchScreenMode('output');
            }
          }
        }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      hotkeyChar: 'E',
      defaultHelp: 'Editor operations, undo, cut, copy, paste, and clipboard access',
      items: [
        {
          label: 'Undo',
          hotkeyChar: 'U',
          shortcut: 'Alt+BkSp',
          helpText: 'Reverse last editing operation',
          action: () => {
            setActiveMenuId(null);
            document.execCommand('undo');
          }
        },
        {
          label: 'Redo',
          hotkeyChar: 'R',
          shortcut: 'Shift+Alt+BkSp',
          helpText: 'Reverse previous Undo',
          action: () => {
            setActiveMenuId(null);
            document.execCommand('redo');
          }
        },
        { isDivider: true, label: '', hotkeyChar: '', helpText: '' },
        {
          label: 'Cut',
          hotkeyChar: 't',
          shortcut: 'Shift+Del',
          helpText: 'Remove selected text and put it in Clipboard',
          action: () => {
            setActiveMenuId(null);
            handleCut();
          }
        },
        {
          label: 'Copy',
          hotkeyChar: 'C',
          shortcut: 'Ctrl+Ins',
          helpText: 'Copy selected text into Clipboard',
          action: () => {
            setActiveMenuId(null);
            handleCopy();
          }
        },
        {
          label: 'Paste',
          hotkeyChar: 'P',
          shortcut: 'Shift+Ins',
          helpText: 'Insert Clipboard contents at cursor',
          action: () => {
            setActiveMenuId(null);
            handlePaste();
          }
        },
        {
          label: 'Clear',
          hotkeyChar: 'e',
          shortcut: 'Ctrl+Del',
          helpText: 'Delete selected text without copying to Clipboard',
          action: () => {
            setActiveMenuId(null);
            if (textareaRef.current) {
              const start = textareaRef.current.selectionStart;
              const end = textareaRef.current.selectionEnd;
              const v = textareaRef.current.value;
              onCodeChange(v.slice(0, start) + v.slice(end));
            }
          }
        },
        {
          label: 'Select All',
          hotkeyChar: 'A',
          shortcut: 'Ctrl+A',
          helpText: 'Select all code in active edit window',
          action: () => {
            setActiveMenuId(null);
            if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.select();
            }
          }
        }
      ]
    },
    {
      id: 'search',
      label: 'Search',
      hotkeyChar: 'S',
      defaultHelp: 'Search for text and compiler error locations',
      items: [
        {
          label: 'Find...',
          hotkeyChar: 'F',
          shortcut: 'Ctrl+Q F',
          helpText: 'Search for text in active edit window',
          action: () => {
            setActiveMenuId(null);
            setShowFindDialog(true);
          }
        },
        {
          label: 'Replace...',
          hotkeyChar: 'R',
          shortcut: 'Ctrl+Q A',
          helpText: 'Search for and replace text in active edit window',
          action: () => {
            setActiveMenuId(null);
            setShowReplaceDialog(true);
          }
        },
        {
          label: 'Search again',
          hotkeyChar: 'S',
          shortcut: 'Ctrl+L',
          helpText: 'Repeat last Find or Replace operation',
          action: () => {
            setActiveMenuId(null);
            if (searchQuery) handleFindNext(searchQuery);
            else setShowFindDialog(true);
          }
        },
        {
          label: 'Go to line number...',
          hotkeyChar: 'G',
          shortcut: 'Ctrl+G',
          helpText: 'Move cursor to specified line number',
          action: () => {
            setActiveMenuId(null);
            handleGoToLine();
          }
        }
      ]
    },
    {
      id: 'run',
      label: 'Run',
      hotkeyChar: 'R',
      defaultHelp: isCompiled
        ? 'Execute program and directly display Output console'
        : 'Source code changed: Compile first before running',
      items: [
        {
          label: 'Run',
          hotkeyChar: 'R',
          disabled: !isCompiled,
          helpText: isCompiled
            ? 'Execute compiled program (.EXE)'
            : 'Source modified: Compile first before running',
          action: () => {
            if (!isCompiled) {
              alert('Cannot run: Please compile the code first before running.');
              return;
            }
            setActiveMenuId(null);
            onRunAction();
          }
        },
        {
          label: 'Program reset',
          hotkeyChar: 'P',
          helpText: 'Release allocated memory and reset debugging runtime',
          action: () => {
            setActiveMenuId(null);
            hapticService.trigger('action');
            alert('Runtime reset: memory freed, speaker silenced.');
          }
        },
        {
          label: 'Trace into',
          hotkeyChar: 'T',
          disabled: !isCompiled,
          helpText: isCompiled
            ? 'Execute statement by statement into functions'
            : 'Compile first before tracing',
          action: () => {
            if (!isCompiled) {
              alert('Cannot run: Please compile first before tracing.');
              return;
            }
            setActiveMenuId(null);
            onRunAction();
          }
        },
        {
          label: 'Step over',
          hotkeyChar: 'S',
          disabled: !isCompiled,
          helpText: isCompiled
            ? 'Execute statement by statement skipping functions'
            : 'Compile first before stepping',
          action: () => {
            if (!isCompiled) {
              alert('Cannot run: Please compile first before stepping.');
              return;
            }
            setActiveMenuId(null);
            onRunAction();
          }
        }
      ]
    },
    {
      id: 'compile',
      label: 'Compile',
      hotkeyChar: 'C',
      defaultHelp: 'Compile, make, and build commands',
      items: [
        {
          label: 'Compile',
          hotkeyChar: 'C',
          helpText: 'Compile current file to .OBJ',
          action: () => {
            setActiveMenuId(null);
            onCompileAction();
          }
        },
        {
          label: 'Make',
          hotkeyChar: 'M',
          helpText: 'Make project to create executable (.EXE)',
          action: () => {
            setActiveMenuId(null);
            onCompileAction();
          }
        },
        {
          label: 'Link',
          hotkeyChar: 'L',
          helpText: 'Link object and library files into .EXE',
          action: () => {
            setActiveMenuId(null);
            onCompileAction();
          }
        },
        {
          label: 'Build all',
          hotkeyChar: 'B',
          helpText: 'Recompile all files in project',
          action: () => {
            setActiveMenuId(null);
            onCompileAction();
          }
        },
        {
          label: 'Information...',
          hotkeyChar: 'I',
          helpText: 'Display memory, lines compiled, and program status',
          action: () => {
            setActiveMenuId(null);
            setShowInfoDialog(true);
          }
        }
      ]
    },
    {
      id: 'debug',
      label: 'Debug',
      hotkeyChar: 'D',
      defaultHelp: 'Source-level debugging commands and watch expressions',
      items: [
        {
          label: 'Evaluate/modify...',
          hotkeyChar: 'E',
          helpText: 'Evaluate expression, calculate values, or assign variables',
          action: () => {
            setActiveMenuId(null);
            setShowEvalDialog(true);
          }
        },
        {
          label: 'Toggle breakpoint',
          hotkeyChar: 'T',
          helpText: 'Set or clear conditional breakpoint on current line',
          action: () => {
            setActiveMenuId(null);
            hapticService.trigger('action');
            alert(`Breakpoint toggled at Line ${cursorPos.line}`);
          }
        },
        {
          label: 'Watch window',
          hotkeyChar: 'W',
          helpText: 'Open debugger watch expression window',
          action: () => {
            setActiveMenuId(null);
            setShowEvalDialog(true);
          }
        }
      ]
    },
    {
      id: 'project',
      label: 'Project',
      hotkeyChar: 'P',
      defaultHelp: 'Project management and multi-file builds',
      items: [
        {
          label: 'Open project...',
          hotkeyChar: 'O',
          helpText: 'Select and load project file (.PRJ) (Open Project File)',
          action: () => {
            setActiveMenuId(null);
            setFileDialogMode('open_project');
            setShowOpenDialog(true);
          }
        },
        {
          label: 'Add item...',
          hotkeyChar: 'A',
          helpText: 'Add a new source file to current project',
          action: () => {
            setActiveMenuId(null);
            if (onCreateFileAction) onCreateFileAction();
          }
        },
        {
          label: 'Delete item',
          hotkeyChar: 'D',
          helpText: 'Remove current file from project and workspace',
          action: () => {
            setActiveMenuId(null);
            if (currentFile && onDeleteFileAction && confirm(`Delete ${currentFile.dosName} permanently?`)) {
              onDeleteFileAction(currentFile.id);
            }
          }
        }
      ]
    }
  ], [
    activeScreenMode,
    allFiles,
    currentFile,
    cursorPos,
    onCodeChange,
    onCompileAction,
    onCreateFileAction,
    onDeleteFileAction,
    onRunAction,
    onSaveAction,
    onSelectFile,
    onSwitchScreenMode,
    searchQuery
  ]);

  const activeMenu = MENUS.find(m => m.id === activeMenuId);

  // Status line text computation
  const statusLineText = useMemo(() => {
    if (hoveredHelpText) return hoveredHelpText;
    if (activeMenu) return activeMenu.defaultHelp;
    return null;
  }, [hoveredHelpText, activeMenu]);

  return (
    <div
      ref={containerRef}
      style={{
        width: ideSize.isMaximized ? '100%' : `${ideSize.width}px`,
        height: ideSize.isMaximized ? '100%' : `${ideSize.height}px`,
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      onPointerMove={(e) => {
        if (!trackpadMode) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({
          x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
          y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
          visible: true
        });
      }}
      onPointerLeave={() => {
        if (trackpadMode) {
          setMousePos(prev => ({ ...prev, visible: false }));
        }
      }}
      className={`relative flex flex-col bg-[#0000AA] border border-[#555555] rounded-none shadow-2xl select-none font-dos overflow-hidden transition-[width,height] duration-75 ${
        crtScanlines ? 'crt-scanlines' : ''
      }`}
    >
      {/* Authentic DOS Hardware Mouse Cursor in Trackpad Mode */}
      {trackpadMode && mousePos.visible && (
        <div
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            pointerEvents: 'none'
          }}
          className="absolute z-50 transform -translate-x-0.5 -translate-y-0.5 transition-none"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="drop-shadow-md">
            <path
              d="M1 1L6.5 14.5L9 9.5L14.5 9L1 1Z"
              fill="white"
              stroke="black"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* ========================================================
          EDGE RESIZE HANDLES
          ======================================================== */}
      {!ideSize.isMaximized && (
        <>
          <div
            onMouseDown={(e) => handleStartResize('e', e)}
            onTouchStart={(e) => handleStartResize('e', e)}
            className="absolute top-0 right-0 w-2.5 h-full cursor-ew-resize hover:bg-[#00AAAA]/40 z-40"
          />
          <div
            onMouseDown={(e) => handleStartResize('s', e)}
            onTouchStart={(e) => handleStartResize('s', e)}
            className="absolute bottom-0 left-0 w-full h-2.5 cursor-ns-resize hover:bg-[#00AAAA]/40 z-40"
          />
          <div
            onMouseDown={(e) => handleStartResize('se', e)}
            onTouchStart={(e) => handleStartResize('se', e)}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize bg-[#00AAAA] text-[#0000AA] flex items-center justify-center font-bold text-xs z-50 select-none"
          >
            ◢
          </div>
        </>
      )}

      {/* ========================================================
          0. AUTHENTIC DOSBOX WINDOW TITLE BAR
          "DOSBox 0.74, Cpu speed: max 100% cycles, Frameskip 0, Program: TC"
          ======================================================== */}
      <div className="h-6 bg-[#2B2B2B] text-[#CCCCCC] px-2 flex items-center justify-between text-[11px] font-sans shrink-0 select-none border-b border-black">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-3.5 h-3.5 bg-[#444444] border border-[#777777] flex items-center justify-center text-[8px] font-bold text-amber-400">
            D
          </div>
          <span className="truncate tracking-tight font-medium">
            DOSBox 0.74, Cpu speed: max 100% cycles, Frameskip 0, Program: TC
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              hapticService.trigger('navigation');
              setIdeSize(prev => ({ ...prev, isMaximized: !prev.isMaximized }));
            }}
            className="w-4 h-4 bg-[#3C3C3C] hover:bg-[#505050] text-[#CCCCCC] text-[9px] flex items-center justify-center border border-[#555555] font-dos font-bold"
            title={ideSize.isMaximized ? 'Restore' : 'Maximize'}
          >
            {ideSize.isMaximized ? '▲' : '■'}
          </button>
        </div>
      </div>

      {/* ========================================================
          1. AUTHENTIC TOP MENU BAR
          ≡ File Edit Search Run Compile Debug Project Options Window Help
          ======================================================== */}
      <div className="h-6 bg-[#A8A8A8] text-black px-1 flex items-center justify-between text-xs shrink-0 select-none border-b border-black relative z-30">
        <div className="flex items-center space-x-0.5 sm:space-x-1 overflow-x-auto no-scrollbar flex-1 min-w-0 pr-1">
          {/* System Menu Button [≡] */}
          <button
            onClick={() => {
              hapticService.trigger('primary');
              setActiveMenuId(activeMenuId === 'system' ? null : 'system');
              setHoveredHelpText(null);
            }}
            className={`px-1.5 py-0.5 font-bold transition-colors shrink-0 whitespace-nowrap ${
              activeMenuId === 'system'
                ? 'bg-[#00AA00] text-black'
                : 'hover:bg-[#00AA00] hover:text-black'
            }`}
          >
            ≡
          </button>

          {/* Menus: File, Edit, Search, Run, Compile, Debug, Project, Options, Window, Help */}
          {MENUS.slice(1).map((menu) => {
            const isOpen = activeMenuId === menu.id;
            const isRunDisabled = menu.id === 'run' && !isCompiled;
            return (
              <button
                key={menu.id}
                onClick={() => {
                  hapticService.trigger('primary');
                  setActiveMenuId(isOpen ? null : menu.id);
                  setHoveredHelpText(null);
                }}
                onMouseEnter={() => setHoveredHelpText(menu.defaultHelp)}
                title={isRunDisabled ? 'Source code modified: Compile first to enable Run' : undefined}
                className={`px-1 sm:px-1.5 py-0.5 transition-colors font-medium shrink-0 whitespace-nowrap ${
                  isOpen
                    ? 'bg-[#00AA00] text-black'
                    : isRunDisabled
                    ? 'text-zinc-500 hover:bg-zinc-300 cursor-pointer'
                    : 'hover:bg-[#00AA00] hover:text-black cursor-pointer'
                }`}
              >
                <span className={`font-bold ${isRunDisabled ? 'text-zinc-500' : 'text-[#AA0000]'}`}>{menu.hotkeyChar}</span>
                <span>{menu.label.slice(1)}</span>
                {isRunDisabled && (
                  <span className="text-[8px] ml-0.5 text-zinc-500 font-mono">!</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Window Zoom Indicator (Separated cleanly so it never overlaps or cuts menu items) */}
        <div className="shrink-0 pl-1.5 border-l border-zinc-500/50 flex items-center">
          <button
            onClick={() => {
              hapticService.trigger('navigation');
              setIdeSize(prev => ({ ...prev, isMaximized: !prev.isMaximized }));
            }}
            className="w-4 h-4 bg-[#A8A8A8] hover:bg-zinc-300 active:bg-zinc-400 border border-black flex items-center justify-center font-bold text-xs text-black cursor-pointer"
            title={ideSize.isMaximized ? "Restore window size" : "Maximize window"}
          >
            {ideSize.isMaximized ? '▲' : '■'}
          </button>
        </div>
      </div>

      {/* ========================================================
          DROPDOWN MENU OVERLAYS
          ======================================================== */}
      {activeMenu && (
        <div
          className="absolute top-12 z-50 bg-[#A8A8A8] border border-black dos-shadow text-black text-xs min-w-[220px] select-none font-dos"
          style={{
            left: activeMenu.id === 'system' ? '4px' :
                  activeMenu.id === 'file' ? '24px' :
                  activeMenu.id === 'edit' ? '60px' :
                  activeMenu.id === 'search' ? '98px' :
                  activeMenu.id === 'run' ? '146px' :
                  activeMenu.id === 'compile' ? '180px' :
                  activeMenu.id === 'debug' ? '236px' :
                  activeMenu.id === 'project' ? '284px' :
                  activeMenu.id === 'options' ? '336px' :
                  activeMenu.id === 'window' ? '388px' : '440px'
          }}
        >
          {activeMenu.items.map((item, idx) => {
            if (item.isDivider) {
              return <div key={idx} className="my-0.5 border-t border-[#555555] border-b border-white" />;
            }

            const hotkeyIndex = item.label.toLowerCase().indexOf(item.hotkeyChar.toLowerCase());
            const beforeHot = hotkeyIndex >= 0 ? item.label.slice(0, hotkeyIndex) : '';
            const afterHot = hotkeyIndex >= 0 ? item.label.slice(hotkeyIndex + 1) : item.label;
            const hotChar = hotkeyIndex >= 0 ? item.label[hotkeyIndex] : '';

            return (
              <div
                key={idx}
                onClick={() => {
                  if (item.disabled) {
                    alert('Cannot run: Please compile the code first (Alt+F9 or Compile menu) before running.');
                    return;
                  }
                  hapticService.trigger('primary');
                  if (item.action) item.action();
                }}
                onMouseEnter={() => setHoveredHelpText(item.helpText)}
                className={`px-3 py-1 flex items-center justify-between cursor-pointer transition-colors ${
                  item.disabled
                    ? 'text-[#555555] cursor-not-allowed bg-transparent'
                    : 'hover:bg-[#00AA00] hover:text-black active:bg-[#008800]'
                }`}
              >
                <div className="flex items-center">
                  <span>{beforeHot}</span>
                  <span className={`font-bold ${item.disabled ? 'text-[#555555]' : 'text-[#AA0000]'}`}>
                    {hotChar}
                  </span>
                  <span>{afterHot}</span>
                  {item.disabled && (
                    <span className="text-[9px] ml-2 text-[#666666] italic">[Compile first]</span>
                  )}
                </div>
                {item.shortcut && (
                  <span className={`text-[10px] ml-4 font-mono ${item.disabled ? 'text-[#777777]' : 'text-zinc-700'}`}>
                    {item.shortcut}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          WORKSPACE (IDE / OUTPUT CONSOLE / BGI GRAPHICS)
          ======================================================== */}
      <div className="flex-1 relative overflow-hidden flex flex-col dos-desktop-pattern">
        {/* ================= MODE 1: TURBO C++ IDE VIEW ================= */}
        {activeScreenMode === 'ide' && (
          <div className="flex-1 relative flex flex-col p-1 overflow-hidden">
            {/* Cascading Windows */}
            {isCascadedView && (
              <>
                <div
                  onClick={() => {
                    hapticService.trigger('action');
                    setActiveWindowNum(1);
                  }}
                  className="absolute top-2 left-2 w-[85%] h-[65%] bg-[#0000AA] border border-[#00AAAA] text-[#00AAAA] p-1 select-none font-dos text-xs opacity-90 cursor-pointer shadow-md"
                >
                  <div className="bg-[#00AAAA] text-[#0000AA] px-1 font-bold flex justify-between">
                    <span>╔═ Clipboard ═</span>
                    <span>1=[↑]</span>
                  </div>
                  <div className="p-2 text-[#AAAAAA] font-mono text-[11px]">
                    (Clipboard ready for Cut / Copy / Paste)
                  </div>
                </div>

                <div
                  onClick={() => {
                    hapticService.trigger('action');
                    setActiveWindowNum(2);
                  }}
                  className="absolute top-6 left-6 w-[85%] h-[65%] bg-[#0000AA] border border-[#00AAAA] text-[#00AAAA] p-1 select-none font-dos text-xs opacity-90 cursor-pointer shadow-md"
                >
                  <div className="bg-[#00AAAA] text-[#0000AA] px-1 font-bold flex justify-between">
                    <span>╔═ HELLO.CPP ═</span>
                    <span>2=[↑]</span>
                  </div>
                  <div className="p-2 text-white font-mono text-[11px]">
                    #include &lt;iostream.h&gt;<br />
                    void main() &#123; cout &lt;&lt; "Turbo C++"; &#125;
                  </div>
                </div>
              </>
            )}

            {/* Active Foreground Editor Window OR Authentic Empty Desktop */}
            {currentFile ? (
              <div
                className={`flex-1 flex flex-col bg-[#0000AA] border-2 border-white shadow-2xl relative overflow-hidden ${
                  isCascadedView ? 'translate-x-4 translate-y-4 z-20' : ''
                }`}
              >
              {/* Active Window Title Bar with Mobile Close Tab button */}
              <div className="h-7 bg-[#0000AA] text-white px-1.5 flex items-center justify-between text-xs font-bold shrink-0 select-none border-b-2 border-white">
                <div className="flex items-center gap-1.5">
                  {/* Authentic DOS Close Box [■] */}
                  <button
                    onClick={() => {
                      hapticService.trigger('action');
                      if (onDeleteFileAction) {
                        onDeleteFileAction(currentFile.id);
                      }
                    }}
                    className="w-4 h-4 bg-[#0000AA] border border-white flex items-center justify-center hover:bg-blue-800 active:bg-blue-950 cursor-pointer"
                    title="Close Window"
                  >
                    <span className="text-[#00AA00] font-black text-xs leading-none">■</span>
                  </button>

                  <span className="text-white tracking-widest hidden sm:inline">═══</span>
                </div>

                <div className="text-white font-bold tracking-wide truncate px-2 flex items-center gap-2">
                  <span>{currentFile.drive}:\{currentFile.dosName}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-white tracking-widest hidden sm:inline">═══</span>
                  <span className="text-white font-bold">{activeWindowNum}=</span>
                  <button
                    onClick={() => {
                      hapticService.trigger('navigation');
                      setIdeSize(prev => ({ ...prev, isMaximized: !prev.isMaximized }));
                    }}
                    className="w-4 h-4 bg-[#0000AA] border border-white flex items-center justify-center hover:bg-blue-800 cursor-pointer"
                    title="Zoom / Restore Window"
                  >
                    <span className="text-[#00AA00] font-bold text-xs leading-none">
                      {ideSize.isMaximized ? '↓' : '↑'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mobile Editor Tabs Strip: only shown when 2 or more files are open */}
              {allFiles.length > 1 && (
                <div className="bg-[#00AAAA] border-b-2 border-white px-1 py-0.5 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 select-none">
                  {allFiles.map(file => {
                    const isActive = currentFile ? file.id === currentFile.id : false;
                    return (
                      <div
                        key={file.id}
                        className={`px-2 py-0.5 text-xs font-mono font-bold flex items-center gap-1.5 border border-white cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#0000AA] text-white shadow-xs'
                            : 'bg-[#A8A8A8] text-black hover:bg-zinc-300'
                        }`}
                        onClick={() => {
                          hapticService.trigger('action');
                          if (onSelectFile) onSelectFile(file);
                        }}
                      >
                        <span className="truncate max-w-[120px]">{file.dosName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticService.trigger('action');
                            if (onDeleteFileAction) {
                              onDeleteFileAction(file.id);
                            }
                          }}
                          className="w-3.5 h-3.5 hover:bg-[#AA0000] hover:text-white rounded-xs flex items-center justify-center text-[9px] font-black cursor-pointer leading-none text-[#AA0000]"
                          title={`Close ${file.dosName}`}
                        >
                          x
                        </button>
                      </div>
                    );
                  })}
                  {onCreateFileAction && (
                    <button
                      onClick={() => {
                        hapticService.trigger('primary');
                        onCreateFileAction();
                      }}
                      className="px-2 py-0.5 bg-[#00AA00] hover:bg-emerald-400 text-black font-bold text-xs border border-black flex items-center gap-1 cursor-pointer"
                      title="New File Tab"
                    >
                      <span>+</span>
                      <span className="hidden sm:inline">New</span>
                    </button>
                  )}
                </div>
              )}

              {/* Editor Body with Syntax Highlight Overlay + Transparent Interactive Textarea */}
              <div
                className="flex-1 relative flex overflow-hidden bg-[#0000AA]"
                onClick={() => onEditorFocus?.()}
                onMouseEnter={() => setCursorInteractionState(prev => prev === 'active' ? 'active' : 'hover')}
                onMouseLeave={() => setCursorInteractionState(prev => prev === 'active' ? 'active' : 'normal')}
              >
                {/* Visual Line Flash on Compiler Error Click */}
                {errorHighlightLine !== null && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none bg-rose-600/35 border-y border-rose-400 z-10"
                    style={{
                      top: `${8 + (errorHighlightLine - 1) * 20}px`,
                      height: '20px',
                      transform: `translateY(-${scrollTop}px)`,
                    }}
                  >
                    <span className="absolute right-2 top-0 text-[10px] font-mono text-rose-200 font-bold bg-rose-900/80 px-1">
                      Line {errorHighlightLine} Error
                    </span>
                  </div>
                )}

                {/* Syntax Highlighted View Overlay (Clean, no fake static underscore causing duplicate =) */}
                <div
                  ref={codeViewerRef}
                  className="absolute inset-0 overflow-hidden pointer-events-none select-none text-white z-0"
                  style={{
                    boxSizing: 'border-box',
                    padding: '8px',
                    margin: '0px',
                    border: '0px none',
                    fontFamily: 'DOS, Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    whiteSpace: 'pre',
                    wordBreak: 'normal',
                    overflowWrap: 'normal',
                    tabSize: 4,
                  }}
                >
                  {highlightedTokens.map((tok, idx) => (
                    <span key={idx} style={{ color: tok.color }}>
                      {tok.text}
                    </span>
                  ))}
                  {codeBuffer.endsWith('\n') && (
                    <span className="inline-block w-0">&nbsp;</span>
                  )}
                </div>

                {/*
                  Interactive Textarea for typing and cursor:
                  - Strictly controlled component reading from decoupled codeBuffer logic state
                  - wrap="off" ensures code does not soft-wrap so horizontal scrollbar functions accurately!
                  - Explicit event handlers for Enter, Backspace, Delete, and Tab with manual line break offset calculation
                  - Caret color turns dynamic:
                    • Normal: crisp white (#FFFFFF)
                    • Hover over text: vibrant orange (#FFAA00)
                    • Click/Touch/Edit: bold red/orange (#FF3300)
                */}
                <textarea
                  ref={textareaRef}
                  value={codeBuffer}
                  onChange={(e) => {
                    setCursorInteractionState('active');
                    const el = e.currentTarget;
                    const pos = el.selectionStart ?? 0;
                    const endPos = el.selectionEnd ?? pos;
                    commitBufferChange(el.value, pos, endPos);
                  }}
                  onScroll={handleScroll}
                  onSelect={handleSelect}
                  onKeyUp={handleSelect}
                  onKeyDown={(e) => {
                    setCursorInteractionState('active');
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExplicitEnter();
                      return;
                    }
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      handleExplicitBackspace();
                      return;
                    }
                    if (e.key === 'Delete') {
                      e.preventDefault();
                      handleExplicitDelete();
                      return;
                    }
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      handleExplicitTab(e.shiftKey);
                      return;
                    }
                    // Auto-closing bracket and quote pairs
                    if (e.key in BRACKET_PAIRS || CLOSING_BRACKETS.has(e.key)) {
                      e.preventDefault();
                      const { start, end } = getEditorSelection();
                      const res = applyKeyMutation(codeBuffer, start, end, e.key, false);
                      commitBufferChange(res.nextVal, res.newStart, res.newEnd);
                      return;
                    }
                  }}
                  onClick={() => {
                    setCursorInteractionState('active');
                    onEditorFocus?.();
                    handleSelect();
                  }}
                  onMouseDown={() => setCursorInteractionState('active')}
                  onMouseUp={() => setCursorInteractionState('active')}
                  onTouchStart={() => {
                    setCursorInteractionState('active');
                    onEditorFocus?.();
                  }}
                  onTouchEnd={() => setCursorInteractionState('active')}
                  onMouseEnter={() => setCursorInteractionState(prev => prev === 'active' ? 'active' : 'hover')}
                  onMouseLeave={() => setCursorInteractionState(prev => prev === 'active' ? 'active' : 'normal')}
                  onFocus={() => {
                    setCursorInteractionState('active');
                    onEditorFocus?.();
                  }}
                  onBlur={() => setCursorInteractionState('normal')}
                  wrap="off"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full h-full bg-transparent text-transparent font-dos text-xs resize-none focus:outline-none z-10 overflow-auto scrollbar-none"
                  style={{
                    boxSizing: 'border-box',
                    padding: '8px',
                    margin: '0px',
                    border: '0px none',
                    fontFamily: 'DOS, Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    whiteSpace: 'pre',
                    wordBreak: 'normal',
                    overflowWrap: 'normal',
                    tabSize: 4,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    caretColor: dynamicCaretColor,
                  }}
                />

                {/* ========================================================
                    VERTICAL FUNCTIONAL SCROLLBAR (Embedded in right border)
                    ======================================================== */}
                <div className="w-4 bg-[#00AAAA] flex flex-col justify-between items-center shrink-0 select-none border-l-2 border-white z-20">
                  {/* Scroll Up Button ▲ */}
                  <button
                    onClick={() => scrollByDelta(0, -60)}
                    className="w-full h-4 text-black hover:bg-teal-300 active:bg-teal-200 flex items-center justify-center text-[9px] font-black"
                  >
                    ▲
                  </button>

                  {/* Vertical Scroll Track & Draggable Thumb */}
                  <div
                    ref={vTrackRef}
                    onClick={handleVerticalTrackClick}
                    onTouchStart={handleVerticalTrackClick}
                    className="flex-1 w-full relative cursor-pointer"
                  >
                    <div
                      onMouseDown={handleStartVThumbDrag}
                      onTouchStart={handleStartVThumbDrag}
                      style={{
                        top: `${vThumbPercent}%`,
                        height: `${Math.max(20, vThumbRatio * 100)}%`
                      }}
                      className="absolute left-0.5 right-0.5 bg-[#0000AA] border border-white rounded-none cursor-ns-resize active:bg-blue-900"
                    />
                  </div>

                  {/* Scroll Down Button ▼ */}
                  <button
                    onClick={() => scrollByDelta(0, 60)}
                    className="w-full h-4 text-black hover:bg-teal-300 active:bg-teal-200 flex items-center justify-center text-[9px] font-black"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* ========================================================
                  BOTTOM BORDER WITH LINE:COL & HORIZONTAL SCROLLBAR
                  ======================================================== */}
              <div className="h-5 bg-[#0000AA] border-t-2 border-white flex items-center justify-between shrink-0 select-none text-xs text-white z-20">
                {/* Left: Line:Col indicator (1:12 as in Borland Turbo C++) & Bracket Pre-Check */}
                <div className="flex items-center gap-2 px-1 font-mono text-[11px] text-[#00FFFF] font-bold">
                  <span>*  {cursorPos.line}:{cursorPos.col}</span>
                  <span
                    className={`text-[10px] font-bold px-1 rounded transition-colors ${
                      braceBalance.isBalanced
                        ? 'text-[#55FF55]'
                        : braceBalance.unmatchedOpen > 0
                        ? 'text-[#FFFF55] bg-amber-950/50'
                        : 'text-[#FF5555] bg-rose-950/50'
                    }`}
                    title="Syntax Brace Match Pre-Check"
                  >
                    {braceBalance.message}
                  </span>
                  <span
                    className="px-1 py-0 text-[9px] font-bold uppercase border transition-colors hidden md:inline"
                    style={{
                      borderColor: dynamicCaretColor,
                      color: dynamicCaretColor,
                    }}
                    title="Real-time Cursor State"
                  >
                    {cursorInteractionState === 'active' ? 'RED:CLICK' : cursorInteractionState === 'hover' ? 'ORANGE:HOVER' : 'WHITE:IDLE'}
                  </span>
                </div>

                {/* Center: Horizontal Scrollbar (◄▓▓▓►) */}
                <div className="flex-1 flex items-center h-full bg-[#00AAAA] border-l-2 border-r-2 border-white mx-1">
                  <button
                    onClick={() => scrollByDelta(-50, 0)}
                    className="w-4 h-full text-black hover:bg-teal-300 flex items-center justify-center text-[9px] font-black shrink-0"
                  >
                    ◄
                  </button>

                  <div
                    ref={hTrackRef}
                    onClick={handleHorizontalTrackClick}
                    onTouchStart={handleHorizontalTrackClick}
                    className="flex-1 h-full relative cursor-pointer overflow-hidden"
                  >
                    <div
                      onMouseDown={handleStartHThumbDrag}
                      onTouchStart={handleStartHThumbDrag}
                      style={{
                        left: `${hThumbPercent}%`,
                        width: `${Math.max(24, hThumbRatio * 100)}%`
                      }}
                      className="absolute top-0.5 bottom-0.5 bg-[#0000AA] border border-white cursor-ew-resize active:bg-blue-900"
                    />
                  </div>

                  <button
                    onClick={() => scrollByDelta(50, 0)}
                    className="w-4 h-full text-black hover:bg-teal-300 flex items-center justify-center text-[9px] font-black shrink-0"
                  >
                    ►
                  </button>
                </div>

                {/* Right: Resizer Junction ╝ */}
                <div className="w-4 h-full text-white font-bold flex items-center justify-center text-xs">
                  ╝
                </div>
              </div>
            </div>
            ) : (
              /* All tabs closed: Authentic Borland Turbo C++ Desktop (Image 2) */
              <div className="flex-1 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
                <div className="bg-[#0000AA] border-2 border-white text-white p-5 max-w-md w-full shadow-2xl font-dos flex flex-col gap-3.5 dos-shadow-lg">
                  <div className="bg-[#00AAAA] text-[#0000AA] px-2 py-0.5 font-bold flex items-center justify-between text-xs border border-white">
                    <span>╔═ Borland Turbo C++ 3.0 ═</span>
                    <span className="text-white">1=[↑]</span>
                  </div>
                  <div className="text-center space-y-1.5 py-1">
                    <div className="text-sm sm:text-base font-black text-[#FFFF55] tracking-wide">
                      ALL EDIT WINDOWS CLOSED
                    </div>
                    <p className="text-xs text-[#AAAAAA] leading-relaxed">
                      Select <span className="text-white font-bold">File → New</span> from the menu above, or tap below to start coding:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-blue-400">
                    <button
                      onClick={() => {
                        hapticService.trigger('primary');
                        if (onCreateFileAction) onCreateFileAction();
                      }}
                      className="px-3 sm:px-4 py-1.5 bg-[#00AA00] hover:bg-emerald-400 active:bg-emerald-600 text-black font-black text-xs border-2 border-black flex items-center gap-2 cursor-pointer shadow-md transition-transform active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                      <span>Create New File</span>
                    </button>
                    <button
                      onClick={() => {
                        hapticService.trigger('action');
                        onOpenAction();
                      }}
                      className="px-3 sm:px-4 py-1.5 bg-[#A8A8A8] hover:bg-white active:bg-zinc-300 text-black font-black text-xs border-2 border-black flex items-center gap-2 cursor-pointer shadow-md transition-transform active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <FolderOpen size={14} />
                      <span>Open File</span>
                    </button>
                    <button
                      onClick={() => {
                        hapticService.trigger('primary');
                        setShowUpdateLogs(true);
                      }}
                      className="px-3 sm:px-4 py-1.5 bg-[#00AAAA] hover:bg-teal-300 active:bg-teal-500 text-black font-black text-xs border-2 border-black flex items-center gap-2 cursor-pointer shadow-md transition-transform active:translate-x-0.5 active:translate-y-0.5"
                      title="View System Update Logs"
                    >
                      <ClipboardList size={14} />
                      <span>Update Logs</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                AUTHENTIC SPLIT MESSAGE WINDOW (#2) - As seen in Image 3 & Image 4
                ======================================================== */}
            {showMessageWindow && (
              <div
                className={`bg-[#00AAAA] border-2 border-white text-[#0000AA] flex flex-col shrink-0 relative overflow-hidden mt-1 shadow-lg select-none font-dos ${
                  isMessageMaximized ? 'h-60 sm:h-72' : 'h-36 sm:h-44'
                }`}
              >
                {/* Message Window Header: [Close Message] ════ Message ════════════════════════════════ 2=[↑] */}
                <div className="h-7 bg-[#008888] border-b-2 border-white px-1.5 flex items-center justify-between text-xs font-bold shrink-0 select-none">
                  {/* Left Side: Clearly visible Close Message Button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        hapticService.trigger('navigation');
                        setShowMessageWindow(false);
                      }}
                      className="h-5 px-1.5 bg-[#AA0000] hover:bg-red-600 active:bg-red-800 border border-white flex items-center gap-1 cursor-pointer text-white font-bold transition-all shadow-xs"
                      title="Close Message Window (Esc)"
                      aria-label="Close Message Window"
                    >
                      <X size={12} className="stroke-[3] text-white" />
                      <span className="text-[10px] sm:text-[11px] font-bold tracking-tight text-white uppercase">Close Message</span>
                    </button>
                    <span className="text-white font-bold tracking-wide text-xs">════ Message ════</span>
                  </div>

                  {/* Right Side: High-contrast visible 2=[↑] Zoom Button */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold tracking-widest hidden md:inline">════════════════════</span>
                    <span className="text-white font-black text-xs">2=</span>
                    <button
                      onClick={() => {
                        hapticService.trigger('navigation');
                        setIsMessageMaximized(!isMessageMaximized);
                      }}
                      className="w-5 h-5 bg-white hover:bg-zinc-200 active:bg-zinc-300 border border-black flex items-center justify-center cursor-pointer transition-all shadow-xs"
                      title={isMessageMaximized ? "Restore Message Window" : "Zoom Message Window"}
                      aria-label="Zoom Message Window"
                    >
                      <span className="text-black font-black text-xs leading-none">
                        {isMessageMaximized ? '↓' : '↑'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Message Window Content (Cyan background, blue text, bright green highlight for active error) */}
                <div className="flex-1 p-1 overflow-y-auto overflow-x-auto dos-scrollbar font-mono text-xs flex flex-col gap-0.5">
                  <div className="text-[#0000AA] font-bold">
                    Compiling {currentFile ? currentFile.dosName : 'PROJECT'}:
                  </div>
                  {compileErrors.length === 0 ? (
                    <div className="text-zinc-700 italic px-2 py-1">
                      No compile errors or warnings reported. Program compiled successfully.
                    </div>
                  ) : (
                    compileErrors.map((err, idx) => {
                      const isActive = idx === activeErrorIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            hapticService.trigger('action');
                            setActiveErrorIndex(idx);
                            jumpToErrorLine(err);
                          }}
                          className={`px-1 py-0.5 cursor-pointer flex items-center transition-colors truncate ${
                            isActive
                              ? 'bg-[#00FF00] text-black font-bold'
                              : 'hover:bg-[#0000AA]/20 text-[#0000AA]'
                          }`}
                        >
                          <span>{isActive ? '•' : ' '}</span>
                          <span className="ml-1">{err}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Horizontal Scrollbar inside Message Window (◄ ▓▓▓ ►) */}
                <div className="h-4 bg-[#00AAAA] border-t-2 border-white flex items-center justify-between px-1 text-[9px] text-[#0000AA] font-bold shrink-0">
                  <button
                    onClick={() => {
                      hapticService.trigger('navigation');
                      if (activeErrorIndex > 0) {
                        const prev = activeErrorIndex - 1;
                        setActiveErrorIndex(prev);
                        jumpToErrorLine(compileErrors[prev]);
                      }
                    }}
                    className="px-1 hover:bg-teal-300 cursor-pointer"
                    title="Prev Error"
                  >
                    ◄
                  </button>
                  <div className="flex-1 mx-2 h-2 bg-[#0000AA]/20 relative">
                    <div
                      style={{
                        left: `${compileErrors.length > 0 ? (activeErrorIndex / compileErrors.length) * 80 : 0}%`
                      }}
                      className="w-8 h-full bg-[#0000AA] absolute"
                    />
                  </div>
                  <button
                    onClick={() => {
                      hapticService.trigger('navigation');
                      if (activeErrorIndex < compileErrors.length - 1) {
                        const next = activeErrorIndex + 1;
                        setActiveErrorIndex(next);
                        jumpToErrorLine(compileErrors[next]);
                      }
                    }}
                    className="px-1 hover:bg-teal-300 cursor-pointer"
                    title="Next Error"
                  >
                    ►
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODE 2: DOS OUTPUT CONSOLE ================= */}
        {activeScreenMode === 'output' && (
          <div className="flex-1 bg-black text-white overflow-hidden select-text flex flex-col">
            {/* Top Clean Console Bar */}
            <div className="h-8 bg-[#181818] border-b border-[#333333] px-3 flex justify-between items-center text-xs shrink-0 select-none">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block ${isWaitingForInput ? 'bg-amber-400 animate-ping' : isExecutionFinished ? 'bg-cyan-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-zinc-200 font-bold font-dos tracking-wide">
                  Turbo C++ DOS Output Screen {isWaitingForInput ? '(Waiting for Input...)' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isExecutionFinished && onBreakAction && (
                  <button
                    onClick={() => {
                      hapticService.trigger('action');
                      onBreakAction();
                    }}
                    className="px-2.5 py-0.5 bg-[#AA0000] hover:bg-red-600 active:bg-red-800 text-white font-bold font-dos text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    title="Stop Program Execution (Ctrl+Break / Ctrl+C)"
                  >
                    <span>■ Stop</span>
                  </button>
                )}
                <button
                  onClick={() => onSwitchScreenMode('ide')}
                  className="px-2.5 py-0.5 bg-[#00AA00] hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold font-dos text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Return to Turbo C++ Editor"
                >
                  <span>Return to Editor</span>
                </button>
                <button
                  onClick={() => {
                    if (!isCompiled) {
                      alert('Cannot run: Please compile the code first before running.');
                      return;
                    }
                    onRunAction();
                  }}
                  disabled={!isCompiled}
                  className={`px-2 py-0.5 font-dos text-xs font-bold flex items-center gap-1 transition-colors ${
                    !isCompiled
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 opacity-40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-yellow-300 border border-zinc-600 cursor-pointer shadow-xs'
                  }`}
                  title={!isCompiled ? 'Compile first before running' : 'Run program again'}
                >
                  <span>Run Again</span>
                </button>
              </div>
            </div>

            {/* Pure Full DOS Monospace Console (Authentic White Text on Black DOS Screen) */}
            <div
              ref={consoleContainerRef}
              onClick={() => {
                if (isExecutionFinished) {
                  onSwitchScreenMode('ide');
                } else if (isWaitingForInput && consoleInputRef.current) {
                  consoleInputRef.current.focus();
                }
              }}
              className="flex-1 p-3 sm:p-4 overflow-auto font-dos text-xs sm:text-sm leading-snug whitespace-pre text-white bg-black cursor-text select-text relative"
              title={isExecutionFinished ? "Click anywhere to return to editor" : "Console Output"}
            >
              {/* Native hidden input for mobile software keyboard and desktop keyboard capture */}
              <input
                ref={consoleInputRef}
                type="text"
                value={currentInputText}
                onChange={(e) => onInputChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSubmitInput?.();
                  }
                }}
                className="opacity-0 absolute top-0 left-0 w-1 h-1 pointer-events-none"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
              />{outputSpans && outputSpans.length > 0 ? (
                outputSpans.map((span, idx) => (
                  <span
                    key={idx}
                    style={{
                      color: span.color || '#FFFFFF',
                      backgroundColor: span.bgColor ? span.bgColor : undefined
                    }}
                  >{span.text}</span>
                ))
              ) : outputBuffer.length > 0 ? (
                <span style={{ color: '#FFFFFF' }}>{outputBuffer.join('')}</span>
              ) : !isWaitingForInput ? (
                <span className="text-zinc-500">
                  Program running in standard DOS output buffer...
                </span>
              ) : null}{isWaitingForInput && (
                <span style={{ color: '#FFFFFF' }} className="font-bold inline">{currentInputText}<span className="inline-block animate-pulse bg-white text-black font-bold px-0.5 ml-0.5">_</span></span>
              )}{isExecutionFinished && (
                <div className="mt-4 text-zinc-400 font-bold select-none flex items-center gap-1.5 whitespace-normal">
                  <span className="text-white">_</span>
                  <span className="text-zinc-400 text-xs font-normal">
                    [Program finished. Press any key or tap Return to Editor]
                  </span>
                </div>
              )}{!isExecutionFinished && !isWaitingForInput && (
                <div className="mt-4 text-zinc-500 font-bold select-none whitespace-normal">
                  <span className="animate-pulse inline-block mr-1 text-white">_</span>
                  <span className="text-zinc-500 text-[11px] font-normal">[Executing...]</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MODE 3: BGI GRAPHICS CANVAS (640x480 VGA) ================= */}
        {activeScreenMode === 'graphics' && (
          <div className="flex-1 bg-black flex flex-col items-center justify-center relative p-1">
            <canvas
              ref={graphicsCanvasRef}
              width={640}
              height={480}
              className="max-w-full max-h-full aspect-[4/3] border border-zinc-700 shadow-2xl bg-black cursor-pointer"
              onClick={() => onSwitchScreenMode('ide')}
              title="Tap screen to return to editor"
            />
            <div className="absolute top-2 right-2 bg-zinc-900/90 text-cyan-300 text-xs px-3 py-1.5 rounded border border-zinc-700 flex items-center gap-3">
              <span className="font-bold text-yellow-400">BGI 640x480 EGA/VGA</span>
              <button
                onClick={() => onSwitchScreenMode('output')}
                className="text-cyan-300 hover:underline text-[11px]"
              >
                [Console]
              </button>
              <button
                onClick={() => onSwitchScreenMode('ide')}
                className="text-emerald-400 font-bold hover:underline"
              >
                [Back to IDE]
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          BOTTOM STATUS BAR (Screenshots 1-8 & 10)
          ======================================================== */}
      <div className="h-7 bg-[#A8A8A8] text-black px-2 flex items-center justify-between text-xs shrink-0 select-none border-t border-black font-dos">
        {statusLineText ? (
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[#AA0000] font-bold text-[11px]">INFO:</span>
            <span className="truncate text-[11px] font-medium">{statusLineText}</span>
          </div>
        ) : showMessageWindow ? (
          /* Footer touch buttons when Message Window is open */
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                hapticService.trigger('primary');
                setShowHelpDialog(true);
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center gap-1 text-[11px]"
            >
              <span className="text-[#AA0000] font-bold">?</span> Help
            </button>
            <button
              onClick={() => {
                hapticService.trigger('action');
                if (compileErrors.length > 0) {
                  const next = (activeErrorIndex + 1) % compileErrors.length;
                  setActiveErrorIndex(next);
                  jumpToErrorLine(compileErrors[next]);
                }
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center gap-1 text-[11px]"
            >
              <span className="text-[#AA0000] font-bold">▼</span> Next
            </button>
            <button
              onClick={() => {
                hapticService.trigger('action');
                if (compileErrors.length > 0) {
                  const prev = (activeErrorIndex - 1 + compileErrors.length) % compileErrors.length;
                  setActiveErrorIndex(prev);
                  jumpToErrorLine(compileErrors[prev]);
                }
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center gap-1 text-[11px]"
            >
              <ChevronUp size={12} className="text-[#AA0000]" /> Prev
            </button>
            <button
              onClick={() => {
                hapticService.trigger('primary');
                onCompileAction();
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center gap-1 text-[11px]"
            >
              <Settings size={12} className="text-[#AA0000]" /> Compile
            </button>
            <button
              onClick={() => {
                if (!isCompiled) {
                  alert('Cannot run: Please compile the code first before running.');
                  return;
                }
                hapticService.trigger('primary');
                onRunAction();
              }}
              disabled={!isCompiled}
              className={!isCompiled
                ? "cursor-not-allowed opacity-40 px-2 py-0.5 rounded bg-zinc-400 text-zinc-700 font-bold flex items-center gap-1 text-[11px]"
                : "cursor-pointer px-2 py-0.5 rounded bg-emerald-700/25 hover:bg-emerald-700/40 text-emerald-950 font-bold flex items-center gap-1 text-[11px]"
              }
              title={!isCompiled ? 'Compile first to enable Run' : 'Run'}
            >
              <Play size={11} className={`fill-current ${!isCompiled ? 'text-zinc-600' : 'text-emerald-700'}`} /> Run
            </button>
            <button
              onClick={() => {
                hapticService.trigger('primary');
                setActiveMenuId(activeMenuId ? null : 'file');
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center gap-1 text-[11px]"
            >
              <Menu size={12} className="text-[#AA0000]" /> Menu
            </button>
          </div>
        ) : (
          /* Standard Mobile Footer touch buttons */
          <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-0.5">
            <span
              onClick={() => {
                hapticService.trigger('primary');
                setShowHelpDialog(true);
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center text-[11px]"
            >
              <span className="text-[#AA0000] font-bold">H</span>elp
            </span>
            <span
              onClick={() => {
                hapticService.trigger('primary');
                onSaveAction();
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center text-[11px]"
            >
              <span className="text-[#AA0000] font-bold">S</span>ave
            </span>
            <span
              onClick={() => {
                hapticService.trigger('primary');
                onOpenAction();
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center text-[11px]"
              title="Open File Manager"
            >
              <span className="text-[#AA0000] font-bold">O</span>pen
            </span>
            <span
              onClick={() => {
                hapticService.trigger('primary');
                onCompileAction();
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center text-[11px]"
            >
              <span className="text-[#AA0000] font-bold">C</span>ompile
            </span>
            <span
              onClick={() => {
                if (!isCompiled) {
                  alert('Cannot run: Please compile the code first before running.');
                  return;
                }
                hapticService.trigger('primary');
                onRunAction();
              }}
              className={!isCompiled
                ? "cursor-not-allowed opacity-40 px-1.5 py-0.5 rounded flex items-center text-[11px] text-zinc-600"
                : "cursor-pointer px-2 py-0.5 rounded bg-emerald-700/25 hover:bg-emerald-700/40 text-emerald-950 font-bold flex items-center gap-1 text-[11px]"
              }
              title={!isCompiled ? 'Compile first to enable Run' : 'Run'}
            >
              <Play size={10} className={`fill-current ${!isCompiled ? 'text-zinc-600' : 'text-emerald-700'}`} />
              <span className={!isCompiled ? 'text-zinc-600 font-bold ml-1' : 'text-[#AA0000] font-bold ml-1'}>R</span>
              <span>un</span>
            </span>
            <span
              onClick={() => {
                hapticService.trigger('primary');
                setActiveMenuId(activeMenuId ? null : 'file');
              }}
              className="cursor-pointer hover:text-white px-1.5 py-0.5 rounded hover:bg-black/20 flex items-center text-[11px]"
            >
              <span className="text-[#AA0000] font-bold">M</span>enu
            </span>
          </div>
        )}

        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-bold shrink-0">
          {trackpadMode && (
            <span className="px-1.5 py-0.2 bg-[#00AA00] text-black font-bold text-[9px] rounded-xs uppercase tracking-tight">
              MOUSE ON
            </span>
          )}
          <span className="text-[#0000AA] truncate max-w-[140px]">
            {currentFile ? `${currentFile.drive}:\\${currentFile.dosName}` : 'C:\\TURBOC3'}
          </span>
        </div>
      </div>

      {/* ========================================================
          AUTHENTIC FILE DIALOG BOX (Image 1, Image 2, & Image 9)
          ======================================================== */}
      {showOpenDialog && (
        <TurboOpenFileDialog
          files={allFiles && allFiles.length > 0 ? allFiles : (currentFile ? [currentFile] : [])}
          activeFileId={currentFile?.id || ''}
          mode={fileDialogMode}
          onSelectFile={(file) => {
            if (onSelectFile) onSelectFile(file);
            setShowOpenDialog(false);
          }}
          onSaveAs={() => {
            onSaveAction();
            setShowOpenDialog(false);
          }}
          onClose={() => setShowOpenDialog(false)}
          onHelp={() => {
            setShowOpenDialog(false);
            setShowHelpDialog(true);
          }}
          onOpenFileManager={onOpenAction}
        />
      )}

      {/* ========================================================
          AUTHENTIC BORLAND LINKING DIALOG (Image 5)
          ======================================================== */}
      {compileDialog?.visible && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-100 font-dos select-none">
          <div className="w-[360px] max-w-[94%] bg-[#A8A8A8] border-2 border-white dos-shadow text-black p-2 flex flex-col gap-2">
            {/* Title Bar */}
            <div className="text-center font-bold text-xs tracking-wider border-b border-black pb-1">
              ═════════ Linking ═════════
            </div>

            {/* Program & Library Paths (Image 5) */}
            <div className="text-xs space-y-0.5 font-mono">
              <div className="flex">
                <span className="w-24 text-[#555500] font-bold">EXE file :</span>
                <span className="font-bold truncate">..\SOURCE\{compileDialog.fileName.replace(/\.(cpp|c)$/i, '.EXE')}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-[#555500] font-bold">Linking  :</span>
                <span className="font-bold truncate">\TURBOC3\LIB\GRAPHICS.LIB</span>
              </div>
            </div>

            {/* Compiling Statistics Table (Image 5) */}
            <div className="bg-[#A8A8A8] text-xs font-mono border-t border-b border-[#555555] py-1 my-1">
              <div className="flex justify-end pr-2 font-bold text-[#555500]">
                <span className="w-16 text-right">Total</span>
                <span className="w-16 text-right">Link</span>
              </div>
              <div className="flex justify-between">
                <span>Lines compiled:</span>
                <div className="flex">
                  <span className="w-16 text-right font-bold">{compileDialog.linesCompiled}</span>
                  <span className="w-16 text-right text-zinc-700">PASS 1</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Warnings:</span>
                <div className="flex">
                  <span className="w-16 text-right font-bold">{compileDialog.warnings.length}</span>
                  <span className="w-16 text-right">0</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <div className="flex">
                  <span className={`w-16 text-right font-bold ${compileDialog.errors.length > 0 ? 'text-red-700' : 'text-black'}`}>
                    {compileDialog.errors.length}
                  </span>
                  <span className="w-16 text-right">0</span>
                </div>
              </div>
            </div>

            {/* Available Memory */}
            <div className="flex justify-between text-xs font-mono">
              <span>Available memory:</span>
              <span className="font-bold">1929K</span>
            </div>

            {/* Blue Action Bar Button (Image 5) */}
            <button
              onClick={() => {
                hapticService.trigger('primary');
                onCloseCompileDialog();
                if (compileDialog.errors.length > 0) {
                  setShowMessageWindow(true);
                  setCompileErrors(compileDialog.errors);
                  setActiveErrorIndex(0);
                  jumpToErrorLine(compileDialog.errors[0]);
                }
              }}
              className="w-full py-1 bg-[#0000AA] hover:bg-blue-800 active:bg-blue-950 text-white font-bold text-center text-xs border border-white mt-1 cursor-pointer"
            >
              {compileDialog.success ? 'Success : Press any key' : 'Errors : Press any key'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          FIND DIALOG
          ======================================================== */}
      {showFindDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 z-50">
          <div className="w-80 bg-[#A8A8A8] border-2 border-white dos-shadow p-3 text-black font-dos">
            <div className="bg-[#0000AA] text-white text-center py-0.5 font-bold text-xs mb-2">
              Find Text
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-black font-bold mb-1">Text to find:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. printf, circle..."
                  className="w-full bg-[#0000AA] text-white p-1 font-mono text-xs border border-black focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowFindDialog(false)}
                className="px-3 py-1 bg-[#A8A8A8] border border-black font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleFindNext(searchQuery);
                  setShowFindDialog(false);
                }}
                className="px-3 py-1 bg-[#00AA00] border border-black font-bold"
              >
                Find Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          REPLACE DIALOG
          ======================================================== */}
      {showReplaceDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 z-50">
          <div className="w-80 bg-[#A8A8A8] border-2 border-white dos-shadow p-3 text-black font-dos">
            <div className="bg-[#0000AA] text-white text-center py-0.5 font-bold text-xs mb-2">
              Search & Replace
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-black font-bold mb-1">Text to find:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0000AA] text-white p-1 font-mono text-xs border border-black"
                />
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Replace with:</label>
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="w-full bg-[#0000AA] text-white p-1 font-mono text-xs border border-black"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowReplaceDialog(false)}
                className="px-3 py-1 bg-[#A8A8A8] border border-black font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReplaceAll(searchQuery, replaceQuery)}
                className="px-3 py-1 bg-[#00AA00] border border-black font-bold"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          INFORMATION DIALOG (Compile -> Information...)
          ======================================================== */}
      {showInfoDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 z-50">
          <div className="w-80 bg-[#A8A8A8] border-2 border-white dos-shadow p-3 text-black font-dos">
            <div className="bg-[#0000AA] text-white text-center py-0.5 font-bold text-xs mb-2">
              ═ Information ═
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Current File:</span>
                <span className="font-bold text-[#0000AA]">{currentFile ? `D:\\${currentFile.dosName}` : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines Compiled:</span>
                <span className="font-bold">{currentFile?.content ? currentFile.content.split('\n').length : 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Code Size:</span>
                <span className="font-bold">{currentFile ? Math.round(currentFile.sizeBytes * 1.8) : 0} bytes</span>
              </div>
              <div className="flex justify-between">
                <span>Data Size:</span>
                <span className="font-bold">{currentFile ? Math.round(currentFile.sizeBytes * 0.9) : 0} bytes</span>
              </div>
              <div className="flex justify-between">
                <span>Available Memory:</span>
                <span className="font-bold text-emerald-800">584,210 bytes</span>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => setShowInfoDialog(false)}
                className="px-4 py-1 bg-[#00AA00] border border-black font-bold text-xs"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EVALUATE/MODIFY DIALOG (Debug -> Evaluate/Modify)
          ======================================================== */}
      {showEvalDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 z-50">
          <div className="w-80 bg-[#A8A8A8] border-2 border-white dos-shadow p-3 text-black font-dos">
            <div className="bg-[#0000AA] text-white text-center py-0.5 font-bold text-xs mb-2">
              Evaluate and Modify
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-black font-bold mb-1">Expression:</label>
                <input
                  type="text"
                  value={evalInput}
                  onChange={(e) => {
                    setEvalInput(e.target.value);
                    try {
                      setEvalOutput(String(Function(`"use strict"; return (${e.target.value});`)()));
                    } catch {
                      setEvalOutput('Syntax Error');
                    }
                  }}
                  className="w-full bg-[#0000AA] text-white p-1 font-mono text-xs border border-black"
                />
              </div>
              <div>
                <label className="block text-black font-bold mb-1">Result:</label>
                <div className="w-full bg-black text-emerald-400 p-1 font-mono text-xs border border-zinc-700">
                  {evalOutput}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowEvalDialog(false)}
                className="px-4 py-1 bg-[#00AA00] border border-black font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          AUTHENTIC TURBO HELP INDEX WINDOW (Image 6)
          ======================================================== */}
      {showHelpDialog && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 z-50 font-dos select-none">
          {/* Help Window [■]════ Help ══════════════════════════════3=[↑]= */}
          <div className="w-[94%] max-w-[540px] h-[75%] bg-[#00AAAA] border-2 border-white dos-shadow-lg text-[#0000AA] flex flex-col relative overflow-hidden">
            {/* Title Bar */}
            <div className="h-6 bg-[#00AAAA] border-b-2 border-white px-1 flex items-center justify-between text-xs font-bold shrink-0 text-black">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    hapticService.trigger('navigation');
                    setShowHelpDialog(false);
                  }}
                  className="w-4 h-4 bg-[#00AAAA] border border-white flex items-center justify-center hover:bg-teal-300"
                  title="Close Help"
                >
                  <span className="text-[#00AA00] font-black text-xs leading-none">■</span>
                </button>
                <span className="text-black font-bold tracking-wide">════ Help ════</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-black font-bold tracking-widest hidden sm:inline">════════════════════</span>
                <span className="text-black font-bold">3=</span>
                <button
                  onClick={() => setShowHelpDialog(false)}
                  className="w-4 h-4 bg-[#00AAAA] border border-white flex items-center justify-center hover:bg-teal-300"
                >
                  <span className="text-[#00AA00] font-bold text-xs leading-none">↑</span>
                </button>
              </div>
            </div>

            {/* Header: Turbo Help Index (Image 6) */}
            <div className="px-3 pt-2 text-black font-bold text-xs uppercase tracking-wider shrink-0">
              Turbo Help Index
            </div>

            {/* Topics list */}
            <div className="flex-1 p-2 overflow-y-auto font-mono text-xs text-black">
              {selectedHelpTopic ? (
                <div className="flex flex-col gap-2 bg-[#0000AA]/10 p-2 border border-[#0000AA]">
                  <div className="flex justify-between items-center border-b border-[#0000AA] pb-1">
                    <span className="font-bold text-sm text-[#0000AA]">{selectedHelpTopic.title}</span>
                    <button
                      onClick={() => setSelectedHelpTopic(null)}
                      className="px-2 py-0.5 bg-[#00AA00] text-black font-bold text-[10px]"
                    >
                      [ Index ]
                    </button>
                  </div>
                  <p className="text-xs text-black">{selectedHelpTopic.desc}</p>
                  <div className="bg-[#0000AA] text-white p-2 font-mono text-xs whitespace-pre">
                    {selectedHelpTopic.example}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        hapticService.trigger('primary');
                        onCodeChange((currentFile?.content || '') + '\n\n' + selectedHelpTopic.example);
                        setShowHelpDialog(false);
                      }}
                      className="px-3 py-1 bg-[#00AA00] text-black font-bold text-xs border border-black cursor-pointer hover:bg-emerald-400"
                    >
                      Insert into Editor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {HELP_TOPICS.map((topic, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        hapticService.trigger('action');
                        setSelectedHelpTopic(topic);
                      }}
                      className="px-1.5 py-0.5 hover:bg-[#0000AA] hover:text-white cursor-pointer truncate font-bold text-black transition-colors"
                    >
                      {topic.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Footer Status Bar (Mobile touch clean) */}
            <div className="h-6 bg-[#A8A8A8] border-t border-black px-2 flex items-center justify-between text-[11px] text-black shrink-0 font-dos">
              <div className="flex items-center space-x-3 truncate">
                <span className="font-bold">Turbo C++ Help System</span>
              </div>
              <button
                onClick={() => setShowHelpDialog(false)}
                className="text-[#AA0000] font-bold hover:underline cursor-pointer px-2 py-0.5"
              >
                Close Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ABOUT DIALOG (Cleaned of credits as requested by user)
          ======================================================== */}
      {showAboutDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 z-50 font-dos select-none">
          <div className="w-80 bg-[#A8A8A8] border-2 border-white dos-shadow p-3 text-black text-center space-y-2">
            <div className="bg-[#0000AA] text-white py-1 font-bold text-xs">
              About Borland Turbo C++
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold">Borland Turbo C++ 3.0</div>
              <div>Copyright (c) 1990, 1992 Borland International, Inc.</div>
              <div className="text-zinc-600 text-[11px] pt-1">
                Authentic 16-bit DOS Architecture with VGA 640x480 Graphics & Console Output
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowAboutDialog(false)}
                className="px-4 py-1 bg-[#00AA00] hover:bg-emerald-400 border border-black font-bold text-xs cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          UPDATE LOGS MODAL
          ======================================================== */}
      {showUpdateLogs && (
        <TurboUpdateLogsModal onClose={() => setShowUpdateLogs(false)} />
      )}
    </div>
  );
};
