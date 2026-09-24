/**
 * Filename Mapper & Sanitizer for DOS 8.3 Filesystems
 * Ported from /bridge/file_mapper.cpp for the client-side host shell
 * Credits: ENCRYPTED CREW
 */

import { DosFile, FilenameMapping } from '../types/emulator';

const DOS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
]);

export class DosFileMapper {
  private mappings: Map<string, FilenameMapping> = new Map();
  private reverseMappings: Map<string, string> = new Map();

  constructor() {
    this.loadInitialMappings();
  }

  private loadInitialMappings() {
    // Pre-mapped standard files
    this.registerMapping('HELLO.CPP', 'HELLO.CPP');
    this.registerMapping('RAINBOW.C', 'RAINBOW.C');
    this.registerMapping('COLOURS.CPP', 'COLOURS.CPP');
    this.registerMapping('SOUND.CPP', 'SOUND.CPP');
    this.registerMapping('CIRCLE.CPP', 'CIRCLE.CPP');
  }

  /**
   * Sanitizes a host filename into a valid DOS 8.3 name.
   * Format: [BASENAME 1-8 chars].[EXT 0-3 chars], all uppercase, no illegal symbols.
   */
  public toDosName(hostName: string, existingDosNames: string[] = []): string {
    const cleanHostName = hostName.trim();
    if (this.mappings.has(cleanHostName)) {
      return this.mappings.get(cleanHostName)!.dosName;
    }

    // Path traversal check
    if (cleanHostName.includes('..') || cleanHostName.includes('/') || cleanHostName.includes('\\')) {
      throw new Error(`Security Violation: Path traversal detected in filename '${cleanHostName}'`);
    }

    const lastDotIndex = cleanHostName.lastIndexOf('.');
    let base = lastDotIndex !== -1 ? cleanHostName.substring(0, lastDotIndex) : cleanHostName;
    let ext = lastDotIndex !== -1 ? cleanHostName.substring(lastDotIndex + 1) : '';

    // Sanitize base: allow only A-Z, 0-9, and valid DOS chars
    base = base.toUpperCase().replace(/[^A-Z0-9_$-]/g, '_');
    ext = ext.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);

    if (base.length === 0) {
      base = 'FILE';
    }

    // Check if reserved DOS name
    if (DOS_RESERVED_NAMES.has(base)) {
      base = `X_${base.substring(0, 6)}`;
    }

    let candidateBase = base.substring(0, 8);
    let candidateDosName = ext.length > 0 ? `${candidateBase}.${ext}` : candidateBase;

    // Handle collision if already used by another file
    const existingSet = new Set(existingDosNames.map(n => n.toUpperCase()));
    let collisionNum = 1;

    while (existingSet.has(candidateDosName)) {
      const suffix = `~${collisionNum}`;
      const allowedBaseLen = Math.max(1, 8 - suffix.length);
      candidateBase = `${base.substring(0, allowedBaseLen)}${suffix}`;
      candidateDosName = ext.length > 0 ? `${candidateBase}.${ext}` : candidateBase;
      collisionNum++;

      if (collisionNum > 999) {
        throw new Error(`Exceeded maximum collisions for 8.3 filename: ${hostName}`);
      }
    }

    this.registerMapping(cleanHostName, candidateDosName, collisionNum - 1);
    return candidateDosName;
  }

  public getHostName(dosName: string): string {
    return this.reverseMappings.get(dosName.toUpperCase()) || dosName;
  }

  public registerMapping(hostName: string, dosName: string, collisionIndex: number = 0) {
    const mapping: FilenameMapping = {
      hostName,
      dosName: dosName.toUpperCase(),
      collisionIndex,
      createdAt: Date.now()
    };
    this.mappings.set(hostName, mapping);
    this.reverseMappings.set(dosName.toUpperCase(), hostName);
  }

  public getAllMappings(): FilenameMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Preserves CRLF line endings required by Borland Turbo C++
   */
  public static ensureDosCrlf(text: string): string {
    // Normalize to LF first, then replace LF with CRLF
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return normalized.replace(/\n/g, '\r\n');
  }
}

export const globalFileMapper = new DosFileMapper();
