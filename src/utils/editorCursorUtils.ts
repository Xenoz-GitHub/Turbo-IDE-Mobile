/**
 * editorCursorUtils.ts
 * High-precision cursor position, character index tracking, and text transformation
 * engine for Turbo C++ Mobile IDE.
 * 
 * Ensures 100% synchronization across:
 * - Explicit Enter key line-break offset calculations (auto-indent & brace offsets)
 * - Explicit Backspace calculations (boundary-safe line merge & tab-stop deletions)
 * - Backspace & Forward Delete (including CRLF \r\n and empty line interactions)
 * - Multi-directional Arrow Navigation (Left, Right, Up, Down) across varying line lengths
 * - Multi-line and Single-line Tab indentation / outdentation
 * - Authentic Borland EGA 4-space tab column calculations
 * - Empty line preservation and boundary clamping
 * 
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

export interface LineCol {
  line: number;
  col: number;
}

/**
 * Fast lookup array of character offsets where each line begins.
 * lineOffsets[0] is always 0.
 * lineOffsets[i] is the starting character index of line i (0-indexed).
 */
export function computeLineOffsets(text: string): number[] {
  const offsets = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

/**
 * Binary search to find which 0-indexed line contains a given character offset.
 */
export function getLineIndexFromOffset(lineOffsets: number[], offset: number): number {
  if (lineOffsets.length <= 1) return 0;
  let low = 0;
  let high = lineOffsets.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineOffsets[mid] <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return Math.max(0, high);
}

/**
 * Calculate 1-indexed Line and Column position from a raw character index.
 * Expands tabs (\t) to 4-space tab stops to match authentic Borland DOS text mode.
 * Handles both LF (\n) and CRLF (\r\n) cleanly.
 */
export function getLineAndCol(text: string, charIndex: number, lineOffsets?: number[]): LineCol {
  if (!text) return { line: 1, col: 1 };
  const safeIdx = Math.max(0, Math.min(charIndex, text.length));

  let lineIndex = 0;
  let lineStart = 0;

  if (lineOffsets && lineOffsets.length > 0) {
    lineIndex = getLineIndexFromOffset(lineOffsets, safeIdx);
    lineStart = lineOffsets[lineIndex] ?? 0;
  } else {
    const lastNl = text.lastIndexOf('\n', safeIdx - 1);
    lineStart = lastNl === -1 ? 0 : lastNl + 1;
    // Count newlines before safeIdx
    let count = 0;
    for (let i = 0; i < lineStart; i++) {
      if (text[i] === '\n') count++;
    }
    lineIndex = count;
  }

  const lineText = text.slice(lineStart, safeIdx);
  let col = 1;
  for (let i = 0; i < lineText.length; i++) {
    if (lineText[i] === '\t') {
      col += 4 - ((col - 1) % 4);
    } else if (lineText[i] !== '\r') {
      col += 1;
    }
  }
  return { line: lineIndex + 1, col };
}

/**
 * Compute the new character index after an Arrow navigation key event.
 * Properly accounts for line lengths, empty lines, and selection collapse.
 */
export function computeArrowMove(
  text: string,
  start: number,
  end: number,
  direction: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
): number {
  const len = text.length;

  if (direction === 'ArrowLeft') {
    if (start !== end) return Math.min(start, end);
    return Math.max(0, start - 1);
  }

  if (direction === 'ArrowRight') {
    if (start !== end) return Math.max(start, end);
    return Math.min(len, start + 1);
  }

  // Vertical navigation (ArrowUp / ArrowDown)
  const pos = start;
  const before = text.slice(0, pos);
  const lines = text.split(/\r?\n/);
  const beforeLines = before.split(/\r?\n/);
  const curLineIdx = beforeLines.length - 1;
  const curColOffset = beforeLines[beforeLines.length - 1].length;

  if (direction === 'ArrowUp') {
    if (curLineIdx === 0) {
      // Already on top line: move to beginning of line (col 1)
      return 0;
    }
    const targetLineIdx = curLineIdx - 1;
    const targetLineText = lines[targetLineIdx] || '';
    const targetColOffset = Math.min(curColOffset, targetLineText.length);

    let targetStartIdx = 0;
    for (let i = 0; i < targetLineIdx; i++) {
      targetStartIdx += lines[i].length + 1; // +1 for the newline separator
    }
    return Math.min(len, targetStartIdx + targetColOffset);
  }

  if (direction === 'ArrowDown') {
    if (curLineIdx >= lines.length - 1) {
      // Already on bottom line: move to end of file
      return len;
    }
    const targetLineIdx = curLineIdx + 1;
    const targetLineText = lines[targetLineIdx] || '';
    const targetColOffset = Math.min(curColOffset, targetLineText.length);

    let targetStartIdx = 0;
    for (let i = 0; i < targetLineIdx; i++) {
      targetStartIdx += lines[i].length + 1;
    }
    return Math.min(len, targetStartIdx + targetColOffset);
  }

  return start;
}

export interface LineBreakOffsetResult {
  nextVal: string;
  newStart: number;
  newEnd: number;
  lineBreakOffset: number;
}

/**
 * Explicit calculation of Enter key line break and manual indentation offset.
 * Prevents browser-native line-splitting miscalculations and jumping.
 * Features smart brace expansion:
 * Typing Enter between { and } formats into:
 * {
 *     |
 * }
 */
export function calculateEnterLineBreakOffset(
  text: string,
  start: number,
  end: number
): LineBreakOffsetResult {
  const safeStart = Math.min(Math.max(0, start), text.length);
  const safeEnd = Math.min(Math.max(0, end), text.length);
  const s = Math.min(safeStart, safeEnd);
  const e = Math.max(safeStart, safeEnd);

  // Find the start offset of the current line
  const lastNl = text.lastIndexOf('\n', s - 1);
  const currentLineStart = lastNl === -1 ? 0 : lastNl + 1;
  const lineBeforeCursor = text.slice(currentLineStart, s);

  // Determine existing leading whitespace on the current line
  const indentMatch = lineBeforeCursor.match(/^[ \t]*/);
  let indent = indentMatch ? indentMatch[0] : '';

  // Check if cursor is directly between { and }
  const charBefore = s > 0 ? text.charAt(s - 1) : '';
  const charAfter = s < text.length ? text.charAt(s) : '';

  if (charBefore === '{' && charAfter === '}') {
    // Smart Indent on Enter inside Braces:
    // {
    //     | (cursor indented 4 spaces)
    // }
    const lineBreakString = '\n' + indent + '    ';
    const closingString = '\n' + indent;
    const nextVal = text.slice(0, s) + lineBreakString + closingString + text.slice(e);
    const newPos = s + lineBreakString.length;
    return {
      nextVal,
      newStart: newPos,
      newEnd: newPos,
      lineBreakOffset: lineBreakString.length,
    };
  }

  // Borland C++ auto-indent enhancement: if the preceding line content ends with '{' or ':', indent +4 spaces
  const trimmedBefore = lineBeforeCursor.trimEnd();
  if (trimmedBefore.endsWith('{') || trimmedBefore.endsWith(':')) {
    indent += '    ';
  }

  // Construct the explicit line break string
  const lineBreakString = '\n' + indent;
  const lineBreakOffset = lineBreakString.length;

  const nextVal = text.slice(0, s) + lineBreakString + text.slice(e);
  const newPos = s + lineBreakOffset;

  return {
    nextVal,
    newStart: newPos,
    newEnd: newPos,
    lineBreakOffset,
  };
}

export interface BackspaceOffsetResult {
  nextVal: string;
  newStart: number;
  newEnd: number;
  offsetRemoved: number;
}

/**
 * Explicit calculation of Backspace key deletion and line break merge offset.
 * Handles:
 * 1. Selection range deletion.
 * 2. Deleting both characters of an auto-closed pair when backspacing right between them:
 *    (|) -> | , {|} -> | , [|] -> | , "|" -> | , '|' -> |
 * 3. Merging lines (deleting \n or \r\n at line boundaries without pushing content to wrong lines).
 * 4. Regular single character deletion.
 */
export function calculateBackspaceOffset(
  text: string,
  start: number,
  end: number
): BackspaceOffsetResult {
  const safeStart = Math.min(Math.max(0, start), text.length);
  const safeEnd = Math.min(Math.max(0, end), text.length);
  const s = Math.min(safeStart, safeEnd);
  const e = Math.max(safeStart, safeEnd);

  if (s !== e) {
    // Delete selected text block
    const nextVal = text.slice(0, s) + text.slice(e);
    return {
      nextVal,
      newStart: s,
      newEnd: s,
      offsetRemoved: e - s,
    };
  }

  if (s === 0) {
    return {
      nextVal: text,
      newStart: 0,
      newEnd: 0,
      offsetRemoved: 0,
    };
  }

  // Check if cursor is between matching bracket/quote pair: delete BOTH characters!
  if (s < text.length) {
    const prevChar = text.charAt(s - 1);
    const nextChar = text.charAt(s);
    if (
      (prevChar === '(' && nextChar === ')') ||
      (prevChar === '{' && nextChar === '}') ||
      (prevChar === '[' && nextChar === ']') ||
      (prevChar === '"' && nextChar === '"') ||
      (prevChar === '\'' && nextChar === '\'')
    ) {
      const nextVal = text.slice(0, s - 1) + text.slice(s + 1);
      const newPos = s - 1;
      return {
        nextVal,
        newStart: newPos,
        newEnd: newPos,
        offsetRemoved: 2,
      };
    }
  }

  // Check if deleting a line break (merging current line into previous line)
  if (s >= 2 && text.slice(s - 2, s) === '\r\n') {
    const nextVal = text.slice(0, s - 2) + text.slice(s);
    const newPos = s - 2;
    return {
      nextVal,
      newStart: newPos,
      newEnd: newPos,
      offsetRemoved: 2,
    };
  }

  if (text.charAt(s - 1) === '\n') {
    const nextVal = text.slice(0, s - 1) + text.slice(s);
    const newPos = s - 1;
    return {
      nextVal,
      newStart: newPos,
      newEnd: newPos,
      offsetRemoved: 1,
    };
  }

  // Delete preceding character within state buffer and update cursor index
  const newPos = s - 1;
  const nextVal = text.slice(0, newPos) + text.slice(s);
  return {
    nextVal,
    newStart: newPos,
    newEnd: newPos,
    offsetRemoved: 1,
  };
}

export interface DeleteOffsetResult {
  nextVal: string;
  newStart: number;
  newEnd: number;
}

/**
 * Explicit calculation of Delete (Forward Delete) key mutation.
 */
export function calculateDeleteOffset(
  text: string,
  start: number,
  end: number
): DeleteOffsetResult {
  const safeStart = Math.min(Math.max(0, start), text.length);
  const safeEnd = Math.min(Math.max(0, end), text.length);
  const s = Math.min(safeStart, safeEnd);
  const e = Math.max(safeStart, safeEnd);

  if (s !== e) {
    const nextVal = text.slice(0, s) + text.slice(e);
    return { nextVal, newStart: s, newEnd: s };
  }

  if (s >= text.length) {
    return { nextVal: text, newStart: s, newEnd: s };
  }

  // Check if deleting CRLF
  if (s + 2 <= text.length && text.slice(s, s + 2) === '\r\n') {
    const nextVal = text.slice(0, s) + text.slice(s + 2);
    return { nextVal, newStart: s, newEnd: s };
  }

  const nextVal = text.slice(0, s) + text.slice(s + 1);
  return { nextVal, newStart: s, newEnd: s };
}

export interface KeyMutationResult {
  nextVal: string;
  newStart: number;
  newEnd: number;
}

export const BRACKET_PAIRS: Record<string, string> = {
  '(': ')',
  '{': '}',
  '[': ']',
  '"': '"',
  '\'': '\'',
};

export const CLOSING_BRACKETS = new Set([')', '}', ']', '"', '\'']);

/**
 * Handle insertion, backspace, delete, enter, and tab key mutations.
 * Supports:
 * - Auto-closing bracket and quote pairs: (, {, [, ", '
 * - Wrapping selected text when typing opening brackets or quotes
 * - Stepping over matching closing brackets/quotes
 * - Smart placeholder selection for quick snippets (e.g. 'n' in for loop, 'choice' in switch)
 * Returns the exact new string and cursor selection range.
 */
export function applyKeyMutation(
  val: string,
  start: number,
  end: number,
  key: string,
  isSpecial: boolean
): KeyMutationResult {
  const safeStart = Math.min(Math.max(0, start), val.length);
  const safeEnd = Math.min(Math.max(0, end), val.length);
  const s = Math.min(safeStart, safeEnd);
  const e = Math.max(safeStart, safeEnd);

  if (!isSpecial) {
    // 1. Check step-over if typing closing bracket and it is already right in front of cursor
    if (CLOSING_BRACKETS.has(key) && s === e && s < val.length && val.charAt(s) === key) {
      return {
        nextVal: val,
        newStart: s + 1,
        newEnd: s + 1,
      };
    }

    // 2. Check auto-closing pairs & selection wrapping
    if (key in BRACKET_PAIRS) {
      const closeChar = BRACKET_PAIRS[key];
      if (s !== e) {
        // Wrap selected text: e.g. "selection" or (selection)
        const wrapped = key + val.slice(s, e) + closeChar;
        const nextVal = val.slice(0, s) + wrapped + val.slice(e);
        return {
          nextVal,
          newStart: s + 1,
          newEnd: e + 1,
        };
      } else {
        // Insert pair with cursor between
        const nextVal = val.slice(0, s) + key + closeChar + val.slice(e);
        return {
          nextVal,
          newStart: s + 1,
          newEnd: s + 1,
        };
      }
    }

    // 3. Quick Snippets with Tab-Stop / Placeholder Selection
    if (key.includes('for (int i = 0; i < n; i++)')) {
      const offset = key.indexOf('n');
      return {
        nextVal: val.slice(0, s) + key + val.slice(e),
        newStart: s + offset,
        newEnd: s + offset + 1,
      };
    }
    if (key.includes('switch (choice)')) {
      const offset = key.indexOf('choice');
      return {
        nextVal: val.slice(0, s) + key + val.slice(e),
        newStart: s + offset,
        newEnd: s + offset + 'choice'.length,
      };
    }
    if (key.includes('cin >> x;')) {
      const offset = key.indexOf('x');
      return {
        nextVal: val.slice(0, s) + key + val.slice(e),
        newStart: s + offset,
        newEnd: s + offset + 1,
      };
    }
    if (key.includes('cout << x;')) {
      const offset = key.indexOf('x');
      return {
        nextVal: val.slice(0, s) + key + val.slice(e),
        newStart: s + offset,
        newEnd: s + offset + 1,
      };
    }
    if (key.includes('if (condition)')) {
      const offset = key.indexOf('condition');
      return {
        nextVal: val.slice(0, s) + key + val.slice(e),
        newStart: s + offset,
        newEnd: s + offset + 'condition'.length,
      };
    }
    if (key.includes('while (condition)')) {
      const offset = key.indexOf('condition');
      return {
        nextVal: val.slice(0, s) + key + val.slice(e),
        newStart: s + offset,
        newEnd: s + offset + 'condition'.length,
      };
    }
    if (key.includes('void main()\n{\n    \n}')) {
      const newPos = s + 'void main()\n{\n    '.length;
      return {
        nextVal: val.slice(0, s) + key + val.slice(e),
        newStart: newPos,
        newEnd: newPos,
      };
    }

    // Normal text insertion
    const nextVal = val.slice(0, s) + key + val.slice(e);
    const newPos = s + key.length;
    return {
      nextVal,
      newStart: newPos,
      newEnd: newPos,
    };
  }

  if (key === 'Backspace') {
    const res = calculateBackspaceOffset(val, s, e);
    return {
      nextVal: res.nextVal,
      newStart: res.newStart,
      newEnd: res.newEnd,
    };
  }

  if (key === 'Delete') {
    return calculateDeleteOffset(val, s, e);
  }

  if (key === 'Enter') {
    const res = calculateEnterLineBreakOffset(val, s, e);
    return {
      nextVal: res.nextVal,
      newStart: res.newStart,
      newEnd: res.newEnd,
    };
  }

  if (key === 'Tab') {
    if (s !== e && val.slice(s, e).includes('\n')) {
      // Multi-line block indent
      const lineStartPos = val.lastIndexOf('\n', s - 1) + 1;
      const lineEndPos = val.indexOf('\n', e);
      const actualEndPos = lineEndPos === -1 ? val.length : lineEndPos;
      const selectedBlock = val.slice(lineStartPos, actualEndPos);
      const lines = selectedBlock.split('\n');
      const indented = lines.map((l) => '    ' + l).join('\n');
      const nextVal = val.slice(0, lineStartPos) + indented + val.slice(actualEndPos);
      const newStart = s + 4;
      const newEnd = e + lines.length * 4;
      return { nextVal, newStart, newEnd };
    }

    // Single-line or point tab insertion
    const lineStartPos = val.lastIndexOf('\n', s - 1) + 1;
    const col = s - lineStartPos;
    const spacesNeeded = 4 - (col % 4);
    const tabSpaces = ' '.repeat(spacesNeeded);
    const nextVal = val.slice(0, s) + tabSpaces + val.slice(e);
    const newPos = s + tabSpaces.length;
    return { nextVal, newStart: newPos, newEnd: newPos };
  }

  return { nextVal: val, newStart: s, newEnd: e };
}

export interface BracketCheckResult {
  isBalanced: boolean;
  unmatchedOpen: number;
  unmatchedClose: number;
  message: string;
}

/**
 * Pre-checks brace balance {} outside of comments and string literals
 * Displays in the bottom status bar for defensive coding and immediate user guidance.
 */
export function checkBraceBalance(code: string): BracketCheckResult {
  let openCount = 0;
  let inString = false;
  let inChar = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const next = code[i + 1] || '';

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (inChar) {
      if (c === '\\') { i++; continue; }
      if (c === '\'') inChar = false;
      continue;
    }

    if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (c === '"') { inString = true; continue; }
    if (c === '\'') { inChar = true; continue; }

    if (c === '{') openCount++;
    if (c === '}') openCount--;
  }

  if (openCount === 0) {
    return { isBalanced: true, unmatchedOpen: 0, unmatchedClose: 0, message: '{} Balanced' };
  } else if (openCount > 0) {
    return { isBalanced: false, unmatchedOpen: openCount, unmatchedClose: 0, message: `! ${openCount} Unmatched {` };
  } else {
    return { isBalanced: false, unmatchedOpen: 0, unmatchedClose: Math.abs(openCount), message: `! ${Math.abs(openCount)} Extra }` };
  }
}
