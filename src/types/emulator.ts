/**
 * Turbo C++ Mobile - Core Type Definitions & Interfaces
 * Credits: ENCRYPTED CREW
 */

export type Orientation = 'portrait' | 'landscape';

export type VideoScaling = 'integer' | 'fit' | 'stretch' | '4:3';

export type AppTab = 'emulator' | 'files' | 'codebase' | 'settings' | 'qa' | 'docs';

export interface DosFile {
  id: string;
  hostName: string;
  dosName: string; // 8.3 format, uppercase, e.g. HELLO.CPP
  content: string;
  sizeBytes: number;
  lastModified: number;
  isReadOnly?: boolean;
  drive: 'C' | 'D';
}

export interface FilenameMapping {
  hostName: string;
  dosName: string;
  collisionIndex: number;
  createdAt: number;
}

export interface CompilerResult {
  success: boolean;
  linesCompiled: number;
  errors: string[];
  warnings: string[];
  outputFile?: string;
  compileTimeMs: number;
}

export interface EmulatorLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'dos';
  message: string;
}

export interface EmulatorSettings {
  cycles: number | 'max';
  videoScaling: VideoScaling;
  crtScanlines: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  clickSound: boolean;
  keyboardHeight: number; // in px or percentage
  keyboardOpacity: number; // 0.1 to 1.0 for landscape overlay
  backButtonAction: 'esc' | 'menu';
  bundledTc: boolean;
  trackpadMode: boolean;
}

export interface QaTestItem {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'compiler' | 'graphics' | 'sound' | 'storage' | 'input';
  status: 'pending' | 'running' | 'passed' | 'failed';
  log?: string;
}
