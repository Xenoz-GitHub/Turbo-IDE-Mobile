/**
 * Mobile Native Storage & File Manager Export Service
 * Prompts user for permission and exports files directly into native mobile storage (Downloads/Files).
 * Credits: ENCRYPTED CREW
 */

import { DosFile } from '../types/emulator';

export interface StoragePermissionPrompt {
  file: DosFile;
  isAll?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Saves a single DosFile directly into the user's mobile device File Manager / Downloads.
 */
export async function saveFileToDeviceStorage(file: DosFile): Promise<{ success: boolean; path: string }> {
  const fileName = file.hostName || file.dosName;
  const content = file.content;

  // Try File System Access API if supported
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'C/C++ Source File',
            accept: {
              'text/plain': ['.c', '.cpp', '.h', '.hpp']
            }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return { success: true, path: fileName };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, path: 'Cancelled by user' };
      }
      // Fallback to Blob download below
    }
  }

  // Universal Mobile & Desktop Blob Download
  const blob = new Blob([content], { type: 'text/x-c;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { success: true, path: `Downloads/${fileName}` };
}

/**
 * Saves all project files to mobile storage.
 */
export async function exportAllProjectsToDevice(files: DosFile[]): Promise<{ success: boolean; count: number }> {
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    await saveFileToDeviceStorage(f);
    // Slight pause so mobile browser handles multiple file downloads reliably
    await new Promise(r => setTimeout(r, 200));
  }
  return { success: true, count: files.length };
}
