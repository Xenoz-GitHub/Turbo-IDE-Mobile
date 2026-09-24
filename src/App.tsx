/**
 * Turbo C++ Mobile v1.0 - Main Application Host Shell
 * Full Portrait & Landscape support, Borland Turbo C++ 3.0 DOS environment,
 * responsive on-screen keyboard with dedicated haptic service, edge-by-edge IDE resizer,
 * single functional DOS scrollbars, and authentic compile-before-run workflow.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DosFile, EmulatorSettings, EmulatorLog, Orientation } from './types/emulator';
import { SAMPLE_PROGRAMS, LIBRARY_PROGRAMS } from './data/samplePrograms';
import { TurboIdeScreen } from './components/TurboIdeScreen';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { FileManagerModal } from './components/FileManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { CreditsModal } from './components/CreditsModal';
import { LegalModal } from './components/LegalModal';
import { StoragePermissionModal } from './components/StoragePermissionModal';
import { ShowcaseLandingPage } from './components/ShowcaseLandingPage';
import PWABuilderHub from './components/PWABuilderHub';
import { IosInstallModal } from './components/IosInstallModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppIcon } from './components/AppIcon';
import { turboCompiler, ExecutionEvent, ConsoleOutputSpan, BORLAND_COLOR_MAP } from './utils/turboCompiler';
import { ConsoleBufferManager } from './utils/consoleBuffer';
import { AsyncInputQueue } from './utils/asyncInputQueue';
import { globalFileMapper } from './utils/fileMapper';
import { pcSpeaker } from './utils/soundEngine';
import { hapticService } from './utils/hapticService';
import { saveFileToDeviceStorage, exportAllProjectsToDevice } from './utils/nativeStorageService';
import {
  FolderOpen,
  Sliders,
  Award,
  HardDrive,
  FileText
} from 'lucide-react';

export default function App() {
  // PWA install state
  const { isInstallable, isInstalled, isIOS, isAndroid, install: installPwa } = usePWAInstall();

  // Navigation mode: 'showcase' (Landing showcase & download hub) or 'ide' (Live Turbo C++ workspace)
  const [viewMode, setViewMode] = useState<'showcase' | 'ide'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (hash.includes('ide') || search.includes('source=pwa') || isStandalone) {
        return 'ide';
      }
    }
    return 'showcase';
  });

  // Mobile orientation: portrait or landscape
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  // Storage & Files: default to warm welcome code with localStorage persistence
  const [files, setFiles] = useState<DosFile[]>(() => {
    try {
      const saved = localStorage.getItem('tc_user_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return SAMPLE_PROGRAMS;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tc_active_file_id');
      if (saved) return saved;
    } catch {}
    return 'welcome';
  });

  // Modals
  const [showFileManager, setShowFileManager] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);
  const [showLegal, setShowLegal] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [pendingStorageSave, setPendingStorageSave] = useState<{ file: DosFile; isAll?: boolean } | null>(null);

  // Keyboard state: closed as default! Opens automatically when user clicks or focuses the code editor
  const [keyboardCollapsed, setKeyboardCollapsed] = useState<boolean>(true);

  // Auto-Save & Crash-Resilience: Debounce-save active file edits into localStorage every 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('tc_user_files', JSON.stringify(files));
        localStorage.setItem('tc_active_file_id', activeFileId);
      } catch {}
    }, 1500);
    return () => clearTimeout(timer);
  }, [files, activeFileId]);

  // Flush-save when tab is closed, refreshed, or backgrounded on mobile
  useEffect(() => {
    const handleFlush = () => {
      try {
        localStorage.setItem('tc_user_files', JSON.stringify(files));
        localStorage.setItem('tc_active_file_id', activeFileId);
      } catch {}
    };
    window.addEventListener('beforeunload', handleFlush);
    document.addEventListener('visibilitychange', handleFlush);
    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      document.removeEventListener('visibilitychange', handleFlush);
    };
  }, [files, activeFileId]);

  // Default settings
  const [settings, setSettings] = useState<EmulatorSettings>(() => {
    const defaults: EmulatorSettings = {
      cycles: 'max',
      videoScaling: '4:3',
      crtScanlines: false,
      soundEnabled: true,
      hapticEnabled: true,
      clickSound: true,
      keyboardHeight: 280,
      keyboardOpacity: 0.95,
      backButtonAction: 'esc',
      bundledTc: true,
      trackpadMode: false
    };
    try {
      const saved = localStorage.getItem('tc_emulator_settings');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {}
    return defaults;
  });

  // Screen & Execution state
  const [activeScreenMode, setActiveScreenMode] = useState<'ide' | 'output' | 'graphics'>('ide');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileDialog, setCompileDialog] = useState<{
    visible: boolean;
    fileName: string;
    linesCompiled: number;
    errors: string[];
    warnings: string[];
    success: boolean;
  } | null>(null);

  const [outputBuffer, setOutputBuffer] = useState<string[]>([]);
  const [outputSpans, setOutputSpans] = useState<ConsoleOutputSpan[]>([]);
  const [isWaitingForInput, setIsWaitingForInput] = useState<boolean>(false);
  const [currentInputText, setCurrentInputText] = useState<string>('');
  const [isWaitingForKey, setIsWaitingForKey] = useState<boolean>(false);
  const [isExecutionFinished, setIsExecutionFinished] = useState<boolean>(false);
  const inputResolverRef = useRef<((val: string) => void) | null>(null);
  const keyResolverRef = useRef<((key: string) => void) | null>(null);
  const [executionEvents, setExecutionEvents] = useState<ExecutionEvent[]>([]);
  const [logs, setLogs] = useState<EmulatorLog[]>([]);

  const consoleBufferRef = useRef<ConsoleBufferManager>(new ConsoleBufferManager(5000, 8000));
  const isSubmittingInputRef = useRef<boolean>(false);

  // Asynchronous input queue separating I/O loop from UI render cycle
  const asyncInputQueueRef = useRef<AsyncInputQueue>(
    new AsyncInputQueue({
      onWaitingInput: (waiting) => {
        setIsWaitingForInput(waiting);
        if (waiting) {
          setCurrentInputText('');
        }
      },
      onWaitingKey: (waiting) => {
        setIsWaitingForKey(waiting);
      },
      onBeforeWait: () => {
        consoleBufferRef.current.flushSync();
      }
    })
  );

  // Synchronize ConsoleBufferManager with React outputSpans state
  useEffect(() => {
    consoleBufferRef.current.setOnFlush((newSpans) => {
      setOutputSpans(newSpans);
    });
  }, []);

  const requestInput = useCallback((): Promise<string> => {
    return asyncInputQueueRef.current.dequeueToken();
  }, []);

  const waitForKey = useCallback((): Promise<string> => {
    return asyncInputQueueRef.current.dequeueKey();
  }, []);

  const handleSubmitInput = useCallback(() => {
    if (isSubmittingInputRef.current) return;
    isSubmittingInputRef.current = true;

    const val = currentInputText;

    // Reset current active input state
    setCurrentInputText('');

    // Echo user's typed input line directly onto console buffer in crisp DOS white
    const echoText = `${val}\n`;
    consoleBufferRef.current.enqueue(echoText, '#FFFFFF');
    consoleBufferRef.current.flushSync();

    // Push into the asynchronous input queue
    asyncInputQueueRef.current.pushInput(val);

    // If legacy resolver is pending, resolve it too
    if (inputResolverRef.current) {
      const resolver = inputResolverRef.current;
      inputResolverRef.current = null;
      resolver(val);
    }

    // Release submit lock on next microtask
    queueMicrotask(() => {
      isSubmittingInputRef.current = false;
    });
  }, [currentInputText]);

  const handleInputChar = useCallback((char: string) => {
    setCurrentInputText(prev => prev + char);
  }, []);

  const handleInputBackspace = useCallback(() => {
    setCurrentInputText(prev => prev.slice(0, -1));
  }, []);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Track whether the current file has been compiled cleanly since last modification
  const [isCompiled, setIsCompiled] = useState<boolean>(true);

  // Listen to hash changes (e.g. #ide or #/ or browser back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('ide')) {
        setViewMode('ide');
      } else if (hash === '' || hash === '#' || hash === '#/') {
        setViewMode('showcase');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Manage window and document body scrolling for showcase vs fixed full-screen IDE
  useEffect(() => {
    if (viewMode === 'showcase') {
      document.documentElement.style.overflowY = 'auto';
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'hidden';
      document.documentElement.classList.add('landing-scrollbar');
      document.body.classList.add('landing-scrollbar');
    } else {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.remove('landing-scrollbar');
      document.body.classList.remove('landing-scrollbar');
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [viewMode]);

  const handleLaunchIde = useCallback((initialFileId?: string) => {
    if (initialFileId) {
      const target = files.find(f => f.id === initialFileId) || LIBRARY_PROGRAMS.find(p => p.id === initialFileId);
      if (target) {
        setFiles(prev => {
          if (prev.some(f => f.id === target.id)) return prev;
          return [target, ...prev];
        });
        setActiveFileId(target.id);
        setIsCompiled(false);
      }
    }
    window.location.hash = '#ide';
    setViewMode('ide');
  }, [files]);

  const handleBackToShowcase = useCallback(() => {
    window.location.hash = '#/';
    setViewMode('showcase');
  }, []);

  // Helper logger
  const addLog = useCallback((message: string, level: EmulatorLog['level'] = 'info') => {
    setLogs(prev => [
      { id: Math.random().toString(36).substring(7), timestamp: Date.now(), level, message },
      ...prev.slice(0, 100)
    ]);
  }, []);

  // Initial boot simulation
  useEffect(() => {
    addLog('DOSBox core initialized with machine=vgaonly, memsize=16MB', 'dos');
    addLog('C:\\TC mounted (C:\\TC\\BIN, C:\\TC\\INCLUDE, C:\\TC\\LIB, C:\\TC\\BGI)', 'dos');
    addLog('D:\\ mounted to user workspace with 8.3 filename mapping', 'dos');
    addLog('Borland Turbo C++ 3.0 launched: C:\\TC\\BIN\\TC.EXE', 'info');
  }, [addLog]);

  // Code editor change
  const handleCodeChange = (newContent: string) => {
    setIsCompiled(false); // Changes made -> Run becomes inactive until compiled!
    setFiles(prev => prev.map(f => f.id === activeFileId ? {
      ...f,
      content: newContent,
      sizeBytes: newContent.length,
      lastModified: Date.now()
    } : f));
  };

  /**
   * Borland Turbo C++ Compile Pipeline (Alt+F9)
   * Validates syntax, reports lines compiled, warnings, errors, and displays dialog
   */
  const handleCompile = () => {
    if (!activeFile) {
      alert('No file is currently open. Please create or open a file first.');
      return;
    }
    setIsCompiling(true);
    addLog(`Compiling ${activeFile.dosName}...`, 'info');

    const result = turboCompiler.compile(activeFile.content, activeFile.dosName);

    setCompileDialog({
      visible: true,
      fileName: activeFile.dosName,
      linesCompiled: result.linesCompiled,
      errors: result.errors,
      warnings: result.warnings,
      success: result.success
    });

    if (result.success) {
      setIsCompiled(true);
      addLog(`Compilation successful for ${activeFile.dosName} (${result.linesCompiled} lines)`, 'info');
    } else {
      setIsCompiled(false);
      addLog(`Compilation failed with ${result.errors.length} errors`, 'error');
    }

    setIsCompiling(false);
  };

  /**
   * Borland Turbo C++ Run Pipeline (Ctrl+F9)
   * Authentic flow: MUST COMPILE FIRST! If uncompiled changes exist, prompt to compile.
   */
  const handleRun = async () => {
    if (!activeFile) {
      alert('No file is currently open. Please create or open a file first.');
      return;
    }

    if (!isCompiled) {
      alert('Cannot run: Please compile the code first (Alt+F9 or Compile menu) before running.');
      return;
    }

    addLog(`Checking & running ${activeFile.dosName}...`, 'info');
    setIsCompiling(true);

    const compResult = turboCompiler.compile(activeFile.content, activeFile.dosName);

    // If compilation fails, show errors and DO NOT run!
    if (!compResult.success) {
      setIsCompiling(false);
      setIsCompiled(false);
      setCompileDialog({
        visible: true,
        fileName: activeFile.dosName,
        linesCompiled: compResult.linesCompiled,
        errors: compResult.errors,
        warnings: compResult.warnings,
        success: false
      });
      addLog(`Run aborted: ${compResult.errors.length} compile errors detected`, 'error');
      return;
    }

    setIsCompiling(false);

    // Clear previous output and graphics queue
    setOutputBuffer([]);
    setOutputSpans([]);
    setExecutionEvents([]);
    setIsWaitingForInput(false);
    setCurrentInputText('');
    setIsWaitingForKey(false);
    setIsExecutionFinished(false);

    // Check if program actually initializes BGI graphics via initgraph()
    const isGraphics = /\binitgraph\s*\(/i.test(activeFile.content);
    if (isGraphics) {
      setActiveScreenMode('graphics');
      addLog('BGI graphics mode initialized (640x480 EGA/VGA)', 'dos');
    } else {
      setActiveScreenMode('output');
      addLog('Program running in DOS console', 'dos');
    }

    // Clear previous screen, console buffer, and input queue
    consoleBufferRef.current.clear();
    asyncInputQueueRef.current.reset();
    setOutputSpans([]);
    setOutputBuffer([]);

    // Execute program
    await turboCompiler.execute(
      activeFile.content,
      (event: ExecutionEvent) => {
        if (event.kind === 'text' && event.text) {
          const colorHex = (event.color !== undefined && BORLAND_COLOR_MAP[event.color]) ? BORLAND_COLOR_MAP[event.color] : '#FFFFFF';
          const bgHex = (event.bgColor !== undefined && BORLAND_COLOR_MAP[event.bgColor]) ? BORLAND_COLOR_MAP[event.bgColor] : undefined;
          consoleBufferRef.current.enqueue(event.text, colorHex, bgHex);
        } else if (event.kind === 'clear') {
          consoleBufferRef.current.clear();
          setOutputBuffer([]);
          setOutputSpans([]);
        } else {
          // Bounded graphics queue
          setExecutionEvents(prev => [...prev.slice(-800), event]);
        }
      },
      () => {
        consoleBufferRef.current.flushSync();
        asyncInputQueueRef.current.close();
        setIsExecutionFinished(true);
        setIsWaitingForInput(false);
        setIsWaitingForKey(false);
        addLog('Program execution completed. Waiting for keypress (getch)...', 'info');
      },
      asyncInputQueueRef.current,
      asyncInputQueueRef.current
    );
  };

  // Break Action (Ctrl+Break / Ctrl+C)
  const handleBreak = () => {
    turboCompiler.breakExecution();
    asyncInputQueueRef.current.close();
    pcSpeaker.nosound();
    consoleBufferRef.current.flushSync();
    if (inputResolverRef.current) {
      inputResolverRef.current('0');
    }
    if (keyResolverRef.current) {
      keyResolverRef.current('esc');
    }
    setIsWaitingForInput(false);
    setIsWaitingForKey(false);
    setIsExecutionFinished(true);
    addLog('Program execution halted by user Break (Ctrl+C)', 'warn');
    alert('Program Execution Halted (Ctrl+Break)');
  };

  // Save File (prompts user for permission and exports to mobile file manager)
  const handleSaveFile = (file?: DosFile) => {
    const target = file || activeFile;
    if (!target) {
      alert('No active file to save. Please create or open a file first.');
      return;
    }
    setPendingStorageSave({ file: target });
  };

  const handleConfirmStorageSave = async () => {
    if (!pendingStorageSave) return;
    const target = pendingStorageSave.file;
    const isAll = pendingStorageSave.isAll;
    setPendingStorageSave(null);

    if (isAll) {
      const res = await exportAllProjectsToDevice(files);
      addLog(`Exported all ${res.count} workspace projects to mobile device storage`, 'info');
      alert(`Successfully saved ${res.count} project files directly to your phone's Files / Downloads folder!`);
    } else {
      const res = await saveFileToDeviceStorage(target);
      if (res.success) {
        addLog(`Saved ${target.dosName} to device storage (${res.path})`, 'info');
        alert(`Saved '${target.hostName || target.dosName}' to your phone's Files / Downloads folder!`);
      }
    }
  };

  // File management
  const handleCreateFile = (name: string, content = '') => {
    const existingDos = files.map(f => f.dosName);
    const dosName = globalFileMapper.toDosName(name, existingDos);
    const newFile: DosFile = {
      id: Math.random().toString(36).substring(7),
      hostName: name,
      dosName,
      drive: 'D',
      sizeBytes: content.length,
      lastModified: Date.now(),
      content: content || `// ${dosName} - Turbo C++ Mobile\n#include<iostream.h>\n#include<conio.h>\n\nvoid main()\n{\n    clrscr();\n    cout<<"Hello from "<< "${dosName}" << endl;\n    getch();\n}\n`
    };

    setFiles(prev => [newFile, ...prev]);
    setActiveFileId(newFile.id);
    addLog(`Created file ${newFile.dosName} (mapped from ${name})`, 'info');
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId) {
        if (filtered.length > 0) {
          setActiveFileId(filtered[0].id);
        } else {
          setActiveFileId('');
        }
      }
      return filtered;
    });
    addLog('File closed from workspace', 'warn');
  };

  const handleDuplicateFile = (file: DosFile) => {
    handleCreateFile(`copy_${file.hostName || file.dosName}`, file.content);
  };

  const handleImportFile = (name: string, content: string) => {
    handleCreateFile(name, content);
  };

  // Virtual Keyboard key tap
  const handleVirtualKey = (key: string, isSpecial = false) => {
    if (activeScreenMode === 'output') {
      if (isWaitingForInput) {
        if (key === 'Enter') {
          handleSubmitInput();
        } else if (key === 'Backspace' || key === 'DEL' || key === 'Delete') {
          handleInputBackspace();
        } else if (key === 'SPACE') {
          handleInputChar(' ');
        } else if (key === 'TAB') {
          handleInputChar('    ');
        } else if (key.length === 1) {
          handleInputChar(key);
        }
        return;
      }

      if (isWaitingForKey && keyResolverRef.current) {
        keyResolverRef.current(key);
        return;
      }

      if (isExecutionFinished) {
        setActiveScreenMode('ide');
        return;
      }
      return;
    }

    if (activeScreenMode === 'graphics') {
      setActiveScreenMode('ide');
      return;
    }

    if (!activeFile) {
      // If no file is open, create a new file first!
      handleCreateFile(`NONAME00.CPP`, `#include<iostream.h>\n#include<conio.h>\n\nvoid main()\n{\n    clrscr();\n    cout<<"Hello Turbo C++"<<endl;\n    getch();\n}\n`);
      return;
    }

    if (key === 'Enter') {
      window.dispatchEvent(new CustomEvent('turbo-editor-enter'));
      return;
    }
    if (key === 'Backspace') {
      window.dispatchEvent(new CustomEvent('turbo-editor-backspace'));
      return;
    }

    // Dispatch event for precision cursor-aware insertion inside TurboIdeScreen
    window.dispatchEvent(new CustomEvent('turbo-insert-key', { detail: { key, isSpecial } }));
  };

  // Physical keyboard handling during Output Mode
  useEffect(() => {
    if (activeScreenMode !== 'output') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent duplicate handling when typing in native input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isWaitingForInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmitInput();
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handleInputBackspace();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setActiveScreenMode('ide');
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          handleInputChar(e.key);
        }
        return;
      }

      if (isWaitingForKey) {
        e.preventDefault();
        asyncInputQueueRef.current.pushKey(e.key);
        if (keyResolverRef.current) {
          keyResolverRef.current(e.key);
        }
        return;
      }

      if (isExecutionFinished) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key.length === 1) {
          e.preventDefault();
          setActiveScreenMode('ide');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreenMode, isWaitingForInput, isWaitingForKey, isExecutionFinished, handleSubmitInput, handleInputBackspace, handleInputChar]);

  // Virtual Keyboard shortcut
  const handleVirtualShortcut = (shortcut: 'ctrl-f9' | 'alt-f9' | 'alt-x' | 'alt-f5' | 'f2' | 'f3' | 'f10' | 'break') => {
    switch (shortcut) {
      case 'ctrl-f9':
        handleRun();
        break;
      case 'alt-f9':
        handleCompile();
        break;
      case 'break':
        handleBreak();
        break;
      case 'f2':
        handleSaveFile();
        break;
      case 'f3':
        setShowFileManager(true);
        break;
      case 'alt-f5':
        setActiveScreenMode(m => m === 'output' ? 'ide' : 'output');
        break;
      case 'f10':
        alert('Borland Menu: Tap File, Run, Compile, or Options at the top of the IDE.');
        break;
      case 'alt-x':
        alert('Borland Turbo C++ 3.0 is running inside DOSBox.');
        break;
    }
  };

  // If in showcase landing page mode
  if (viewMode === 'showcase') {
    return (
      <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <ShowcaseLandingPage
          onLaunchIde={handleLaunchIde}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          isIOS={isIOS}
          isAndroid={isAndroid}
          onInstallPwa={installPwa}
          onOpenCredits={() => setShowCredits(true)}
          onOpenLegal={() => setShowLegal(true)}
        />

        {showCredits && (
          <CreditsModal onClose={() => setShowCredits(false)} />
        )}

        {showLegal && (
          <LegalModal onClose={() => setShowLegal(false)} />
        )}

        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black text-zinc-100 flex flex-col overflow-hidden font-sans select-none z-10">
      {/* ========================================================
          TOP NAVIGATION BAR (MOBILE ONLY)
          Clean mobile toolbar with AppIcon, tools, and
          ONLY 1 official Credits button opening the Credits modal.
          ======================================================== */}
      <header className="h-12 bg-zinc-950 border-b border-zinc-800 px-2.5 sm:px-3 flex items-center justify-between shrink-0 z-20">
        {/* Left: App Icon & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <AppIcon size={26} className="shrink-0" />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-white text-sm sm:text-base tracking-wide font-dos leading-none">
                Turbo C++
              </span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono font-bold px-1 py-0.5 rounded leading-none">
                Mobile
              </span>
            </div>
          </div>
        </div>

        {/* Right: Modals & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* In-App PWA Install Action */}
          <PWAInstallButton variant="header" />

          {/* Dedicated Credits Button (opens official Credits modal) */}
          <button
            onClick={() => {
              hapticService.trigger('primary');
              setShowCredits(true);
            }}
            className="p-1.5 bg-gradient-to-r from-amber-600/30 to-teal-600/30 hover:from-amber-600/50 hover:to-teal-600/50 text-amber-300 border border-amber-500/40 rounded-lg flex items-center justify-center transition-all shadow-xs cursor-pointer"
            title="View Official Project Credits"
          >
            <Award size={15} className="text-amber-400" />
          </button>

          <button
            onClick={() => {
              hapticService.trigger('navigation');
              setShowFileManager(true);
            }}
            className="p-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-lg border border-zinc-750 flex items-center gap-1 text-xs shadow-xs cursor-pointer"
            title="Files & Workspace (D:\)"
          >
            <FolderOpen size={14} className="text-cyan-400" />
            <span className="hidden md:inline">Files</span>
          </button>

          <button
            onClick={() => {
              hapticService.trigger('primary');
              handleSaveFile();
            }}
            className="p-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 hover:text-white rounded-lg border border-emerald-600/40 flex items-center gap-1 text-xs shadow-xs cursor-pointer"
            title="Save Project to Phone File Manager"
          >
            <HardDrive size={14} className="text-emerald-400" />
            <span className="hidden lg:inline">Save to Phone</span>
          </button>

          <button
            onClick={() => {
              hapticService.trigger('navigation');
              setShowSettings(true);
            }}
            className="p-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-lg border border-zinc-750 text-xs shadow-xs cursor-pointer"
            title="Settings & Diagnostics"
          >
            <Sliders size={14} />
          </button>

          <button
            onClick={() => {
              hapticService.trigger('navigation');
              setShowLegal(true);
            }}
            className="p-1.5 bg-zinc-850 hover:bg-zinc-800 text-amber-300 hover:text-white rounded-lg border border-zinc-750 text-xs shadow-xs flex items-center gap-1 cursor-pointer"
            title="Legal Credits & Documentation"
          >
            <FileText size={14} className="text-amber-400" />
            <span className="hidden md:inline">Docs</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN WORKSPACE LAYOUT (PORTRAIT VS LANDSCAPE)
          ======================================================== */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-black">
        {orientation === 'portrait' ? (
          /* ====================================================
             PORTRAIT MODE:
             - IDE screen takes top section
             - Custom on-screen keyboard takes bottom section
             ==================================================== */
          <div className="w-full h-full flex flex-col justify-between overflow-hidden">
            {/* Top: IDE Display Screen */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-1 bg-black">
              <TurboIdeScreen
                currentFile={activeFile}
                allFiles={files}
                onSelectFile={(f) => {
                  setActiveFileId(f.id);
                  setIsCompiled(false);
                  addLog(`Opened ${f.dosName}`, 'info');
                }}
                onCodeChange={handleCodeChange}
                videoScaling={settings.videoScaling}
                crtScanlines={settings.crtScanlines}
                isCompiling={isCompiling}
                isCompiled={isCompiled}
                compileDialog={compileDialog}
                onCloseCompileDialog={() => setCompileDialog(null)}
                activeScreenMode={activeScreenMode}
                onSwitchScreenMode={setActiveScreenMode}
                outputBuffer={outputBuffer}
                outputSpans={outputSpans}
                executionEvents={executionEvents}
                trackpadMode={settings.trackpadMode}
                onRunAction={handleRun}
                onCompileAction={handleCompile}
                onSaveAction={handleSaveFile}
                onOpenAction={() => setShowFileManager(true)}
                onCreateFileAction={() => handleCreateFile(`NONAME0${files.length}.CPP`)}
                onDeleteFileAction={handleDeleteFile}
                isWaitingForInput={isWaitingForInput}
                currentInputText={currentInputText}
                isExecutionFinished={isExecutionFinished}
                onInputChange={setCurrentInputText}
                onSubmitInput={handleSubmitInput}
                onBreakAction={handleBreak}
                onEditorFocus={() => setKeyboardCollapsed(false)}
              />
            </div>

            {/* Bottom: Custom On-Screen Mobile Keyboard */}
            <div className="w-full shrink-0">
              <VirtualKeyboard
                onKeyPress={handleVirtualKey}
                onShortcut={handleVirtualShortcut}
                height={settings.keyboardHeight}
                opacity={settings.keyboardOpacity}
                soundEnabled={settings.soundEnabled && settings.clickSound}
                hapticEnabled={settings.hapticEnabled}
                isLandscape={false}
                collapsed={keyboardCollapsed}
                onToggleCollapse={() => setKeyboardCollapsed(!keyboardCollapsed)}
              />
            </div>
          </div>
        ) : (
          /* ====================================================
             LANDSCAPE MODE:
             - Full widescreen IDE workspace
             - Dockable or overlay touch keyboard with opacity
             ==================================================== */
          <div className="w-full h-full relative overflow-hidden flex flex-col">
            {/* Full Display Screen */}
            <div className="flex-1 w-full h-full overflow-hidden p-1 bg-black flex items-center justify-center">
              <TurboIdeScreen
                currentFile={activeFile}
                allFiles={files}
                onSelectFile={(f) => {
                  setActiveFileId(f.id);
                  setIsCompiled(false);
                  addLog(`Opened ${f.dosName}`, 'info');
                }}
                onCodeChange={handleCodeChange}
                videoScaling={settings.videoScaling}
                crtScanlines={settings.crtScanlines}
                isCompiling={isCompiling}
                isCompiled={isCompiled}
                compileDialog={compileDialog}
                onCloseCompileDialog={() => setCompileDialog(null)}
                activeScreenMode={activeScreenMode}
                onSwitchScreenMode={setActiveScreenMode}
                outputBuffer={outputBuffer}
                outputSpans={outputSpans}
                executionEvents={executionEvents}
                trackpadMode={settings.trackpadMode}
                onRunAction={handleRun}
                onCompileAction={handleCompile}
                onSaveAction={handleSaveFile}
                onOpenAction={() => setShowFileManager(true)}
                onCreateFileAction={() => handleCreateFile(`NONAME0${files.length}.CPP`)}
                onDeleteFileAction={handleDeleteFile}
                isWaitingForInput={isWaitingForInput}
                currentInputText={currentInputText}
                isExecutionFinished={isExecutionFinished}
                onInputChange={setCurrentInputText}
                onSubmitInput={handleSubmitInput}
                onBreakAction={handleBreak}
                onEditorFocus={() => setKeyboardCollapsed(false)}
              />
            </div>

            {/* Landscape Overlay or Docked Keyboard */}
            <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
              <VirtualKeyboard
                onKeyPress={handleVirtualKey}
                onShortcut={handleVirtualShortcut}
                height={Math.min(settings.keyboardHeight, 240)}
                opacity={settings.keyboardOpacity}
                soundEnabled={settings.soundEnabled && settings.clickSound}
                hapticEnabled={settings.hapticEnabled}
                isLandscape={true}
                collapsed={keyboardCollapsed}
                onToggleCollapse={() => setKeyboardCollapsed(!keyboardCollapsed)}
              />
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODALS & OVERLAYS
          ======================================================== */}
      {showCredits && (
        <CreditsModal onClose={() => setShowCredits(false)} />
      )}

      {showFileManager && (
        <FileManagerModal
          files={files}
          activeFileId={activeFileId}
          onSelectFile={(f) => {
            setActiveFileId(f.id);
            addLog(`Switched active file to ${f.dosName}`, 'info');
          }}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onDuplicateFile={handleDuplicateFile}
          onImportFile={handleImportFile}
          onSaveToPhone={(f, isAll) => setPendingStorageSave({ file: f, isAll })}
          onClose={() => setShowFileManager(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newVals) => {
            setSettings(prev => {
              const updated = { ...prev, ...newVals };
              try {
                localStorage.setItem('tc_emulator_settings', JSON.stringify(updated));
              } catch {}
              return updated;
            });
            if (newVals.soundEnabled !== undefined) {
              pcSpeaker.setEnabled(newVals.soundEnabled);
            }
            if (newVals.hapticEnabled !== undefined) {
              hapticService.setEnabled(newVals.hapticEnabled);
            }
          }}
          logs={logs}
          onResetTcConfig={() => {
            addLog('Reset TCCONFIG.TC to default Borland paths', 'warn');
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showLegal && (
        <LegalModal onClose={() => setShowLegal(false)} />
      )}

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
            setViewMode('ide');
          }}
        />
      )}

      {/* Mobile Storage Permission Modal */}
      {pendingStorageSave && (
        <StoragePermissionModal
          file={pendingStorageSave.file}
          isAll={pendingStorageSave.isAll}
          onConfirm={handleConfirmStorageSave}
          onCancel={() => setPendingStorageSave(null)}
        />
      )}

      {/* Connectivity & Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
