/**
 * Robust Circular Buffer Console Manager for Turbo C++ Mobile
 * 
 * Features:
 * 1. Strict circular ring buffer pattern with a hard limit of 5,000 lines (O(1) overwriting).
 * 2. High-throughput microtask/frame-batched queue for infinite outputs & heavy computation.
 * 3. Handles multi-byte ANSI sequences across arbitrary chunk boundaries without breaking.
 * 4. Preserves stateful Borland text attributes (textcolor/textbackground) at the buffer tail across truncations.
 * 5. Synchronous flush capability (flushSync) for interactive prompts (cin/scanf/getch).
 */

export interface ConsoleOutputSpan {
  text: string;
  color: string;
  bgColor?: string;
}

/**
 * Standard Borland EGA/VGA 16-Color Palette
 */
export const BORLAND_HEX_PALETTE: Record<number, string> = {
  0: '#000000', // BLACK
  1: '#0000AA', // BLUE
  2: '#00AA00', // GREEN
  3: '#00AAAA', // CYAN
  4: '#AA0000', // RED
  5: '#AA00AA', // MAGENTA
  6: '#AA5500', // BROWN
  7: '#AAAAAA', // LIGHTGRAY
  8: '#555555', // DARKGRAY
  9: '#5555FF', // LIGHTBLUE
  10: '#55FF55', // LIGHTGREEN
  11: '#55FFFF', // LIGHTCYAN
  12: '#FF5555', // LIGHTRED
  13: '#FF55FF', // LIGHTMAGENTA
  14: '#FFFF55', // YELLOW
  15: '#FFFFFF', // WHITE
};

/**
 * ANSI SGR (Select Graphic Rendition) mapping to Borland colors
 */
const ANSI_FG_MAP: Record<number, string> = {
  30: '#000000',
  31: '#AA0000',
  32: '#00AA00',
  33: '#AA5500',
  34: '#0000AA',
  35: '#AA00AA',
  36: '#00AAAA',
  37: '#AAAAAA',
  90: '#555555',
  91: '#FF5555',
  92: '#55FF55',
  93: '#FFFF55',
  94: '#5555FF',
  95: '#FF55FF',
  96: '#55FFFF',
  97: '#FFFFFF',
};

const ANSI_BG_MAP: Record<number, string> = {
  40: '#000000',
  41: '#AA0000',
  42: '#00AA00',
  43: '#AA5500',
  44: '#0000AA',
  45: '#AA00AA',
  46: '#00AAAA',
  47: '#AAAAAA',
  100: '#555555',
  101: '#FF5555',
  102: '#55FF55',
  103: '#FFFF55',
  104: '#5555FF',
  105: '#FF55FF',
  106: '#55FFFF',
  107: '#FFFFFF',
};

export class ConsoleBufferManager {
  private readonly maxLines: number;
  private readonly maxSpanLength: number;

  // Circular ring buffer of completed lines
  private ring: (ConsoleOutputSpan[] | null)[];
  private head: number = 0; // Index of the oldest line in the ring
  private lineCount: number = 0; // Current count of full lines in the ring (capped at maxLines)

  // Current line being written to (the buffer tail)
  private tailLineSpans: ConsoleOutputSpan[] = [];

  // Stateful Borland & ANSI attributes at buffer tail
  private currentColor: string = '#FFFFFF';
  private currentBgColor: string | undefined = undefined;
  private isBold: boolean = false;

  // Stream residue buffer for incomplete multi-byte ANSI sequences or UTF-16 surrogates
  private ansiResidual: string = '';

  // Frame-batched ingestion queue
  private pendingQueue: Array<{ text: string; color?: string; bgColor?: string }> = [];
  private flushTimer: number | null = null;
  private onFlushCallback: ((spans: ConsoleOutputSpan[]) => void) | null = null;

  constructor(maxLines: number = 5000, maxSpanLength: number = 8000) {
    this.maxLines = maxLines;
    this.maxSpanLength = maxSpanLength;
    this.ring = new Array(maxLines).fill(null);
  }

  /**
   * Register a listener callback to receive flushed output spans for React state
   */
  public setOnFlush(cb: (spans: ConsoleOutputSpan[]) => void) {
    this.onFlushCallback = cb;
  }

  /**
   * Resets and clears all spans, line counters, and pending queues
   */
  public clear() {
    this.ring = new Array(this.maxLines).fill(null);
    this.head = 0;
    this.lineCount = 0;
    this.tailLineSpans = [];
    this.currentColor = '#FFFFFF';
    this.currentBgColor = undefined;
    this.isBold = false;
    this.ansiResidual = '';
    this.pendingQueue = [];

    if (this.flushTimer !== null) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.flushTimer);
      } else {
        clearTimeout(this.flushTimer);
      }
      this.flushTimer = null;
    }

    if (this.onFlushCallback) {
      this.onFlushCallback([]);
    }
  }

  /**
   * Enqueue a text chunk into the high-speed batching queue.
   * Batches rapid bursts (e.g. infinite loops) to ~60 FPS via requestAnimationFrame
   * to guarantee smooth UI responsiveness without React render thrashing.
   */
  public enqueue(rawText: string, color?: string, bgColor?: string) {
    if (!rawText) return;
    this.pendingQueue.push({ text: rawText, color, bgColor });

    if (this.flushTimer === null) {
      if (typeof requestAnimationFrame === 'function') {
        this.flushTimer = requestAnimationFrame(() => {
          this.flushTimer = null;
          this.drainQueue();
        });
      } else {
        this.flushTimer = setTimeout(() => {
          this.flushTimer = null;
          this.drainQueue();
        }, 16) as any;
      }
    }
  }

  /**
   * Synchronously drains all queued chunks and commits to the circular buffer.
   * MUST be invoked before interactive cin / scanf prompts, waitForKey, break, or onComplete.
   */
  public flushSync() {
    if (this.flushTimer !== null) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.flushTimer);
      } else {
        clearTimeout(this.flushTimer);
      }
      this.flushTimer = null;
    }
    this.drainQueue();
  }

  /**
   * Returns current snapshot of output spans coalesced for React rendering
   */
  public getSpans(): ConsoleOutputSpan[] {
    const result: ConsoleOutputSpan[] = [];
    let currentMerged: ConsoleOutputSpan | null = null;

    const pushSpan = (span: ConsoleOutputSpan) => {
      if (!span.text) return;
      if (
        currentMerged &&
        currentMerged.color === span.color &&
        currentMerged.bgColor === span.bgColor &&
        currentMerged.text.length + span.text.length < this.maxSpanLength
      ) {
        currentMerged.text += span.text;
      } else {
        if (currentMerged) {
          result.push(currentMerged);
        }
        currentMerged = { text: span.text, color: span.color, bgColor: span.bgColor };
      }
    };

    // 1. Traverse lines in circular ring from oldest (head) to newest
    for (let i = 0; i < this.lineCount; i++) {
      const idx = (this.head + i) % this.maxLines;
      const line = this.ring[idx];
      if (line) {
        for (let j = 0; j < line.length; j++) {
          pushSpan(line[j]);
        }
      }
    }

    // 2. Traverse current tail line (uncompleted line)
    for (let j = 0; j < this.tailLineSpans.length; j++) {
      pushSpan(this.tailLineSpans[j]);
    }

    if (currentMerged) {
      result.push(currentMerged);
    }

    return result;
  }

  /**
   * Drains pending queue into the circular line buffer
   */
  private drainQueue() {
    if (this.pendingQueue.length === 0) return;

    const queue = this.pendingQueue;
    this.pendingQueue = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      this.processChunk(item.text, item.color, item.bgColor);
    }

    if (this.onFlushCallback) {
      this.onFlushCallback(this.getSpans());
    }
  }

  /**
   * Processes a raw chunk: handles multi-byte ANSI sequences, Borland attributes,
   * and splits into lines for circular buffer storage.
   */
  private processChunk(rawText: string, explicitColor?: string, explicitBgColor?: string) {
    if (!rawText) return;

    // Apply explicit Borland attributes if provided
    if (explicitColor) {
      this.currentColor = explicitColor;
    }
    if (explicitBgColor !== undefined) {
      this.currentBgColor = explicitBgColor;
    }

    // Prepend any residual from previous chunk (handles split ANSI sequences or split UTF-16 surrogates)
    let text = this.ansiResidual + rawText.replace(/\r\n/g, '\n').replace(/\r/g, '');
    this.ansiResidual = '';

    // Check if text ends with an incomplete ANSI escape sequence
    const lastEsc = text.lastIndexOf('\x1b');
    if (lastEsc !== -1) {
      const tail = text.slice(lastEsc);
      // If it's an unfinished escape sequence (e.g. \x1b, \x1b[, \x1b[1;3)
      if (/^\x1b(?:\[[\d;]*)?$/.test(tail)) {
        this.ansiResidual = tail;
        text = text.slice(0, lastEsc);
      }
    }

    // Check for trailing incomplete high surrogate
    if (text.length > 0) {
      const lastCode = text.charCodeAt(text.length - 1);
      if (lastCode >= 0xD800 && lastCode <= 0xDBFF) {
        this.ansiResidual = text.charAt(text.length - 1) + this.ansiResidual;
        text = text.slice(0, -1);
      }
    }

    if (!text) return;

    // Tokenize text into regular characters and ANSI escape sequences
    // Matches \x1b\[([0-9;]*)([a-zA-Z])
    const ansiRegex = /\x1b\[([\d;]*)([a-zA-Z])/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = ansiRegex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore.length > 0) {
        this.appendPlainText(textBefore);
      }

      const params = match[1];
      const cmd = match[2];

      // Handle SGR (Select Graphic Rendition) color attributes
      if (cmd === 'm') {
        this.handleAnsiSgr(params);
      } else if (cmd === 'J' && params === '2') {
        // Clear screen \x1b[2J
        this.clear();
      }

      lastIndex = ansiRegex.lastIndex;
    }

    // Process remaining text after the last ANSI escape sequence
    if (lastIndex < text.length) {
      this.appendPlainText(text.substring(lastIndex));
    }
  }

  /**
   * Parses ANSI SGR codes to update stateful Borland text attributes
   */
  private handleAnsiSgr(paramStr: string) {
    if (!paramStr || paramStr === '0') {
      this.currentColor = '#FFFFFF';
      this.currentBgColor = undefined;
      this.isBold = false;
      return;
    }

    const parts = paramStr.split(';').map(p => parseInt(p, 10)).filter(p => !isNaN(p));
    for (let i = 0; i < parts.length; i++) {
      const code = parts[i];
      if (code === 0) {
        this.currentColor = '#FFFFFF';
        this.currentBgColor = undefined;
        this.isBold = false;
      } else if (code === 1) {
        this.isBold = true;
      } else if (code === 22) {
        this.isBold = false;
      } else if (ANSI_FG_MAP[code]) {
        this.currentColor = ANSI_FG_MAP[code];
      } else if (code === 39) {
        this.currentColor = '#FFFFFF';
      } else if (ANSI_BG_MAP[code]) {
        this.currentBgColor = ANSI_BG_MAP[code];
      } else if (code === 49) {
        this.currentBgColor = undefined;
      }
    }
  }

  /**
   * Appends plain text into the circular buffer.
   * Splits on newlines '\n' to commit complete lines into the circular ring buffer.
   */
  private appendPlainText(text: string) {
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const segment = lines[i];

      if (segment.length > 0) {
        this.appendSpanToTail(segment, this.currentColor, this.currentBgColor);
      }

      // If not the last item in split, a newline occurred!
      if (i < lines.length - 1) {
        this.commitCurrentLine();
      }
    }
  }

  /**
   * Appends a text span into the current uncommitted tail line.
   */
  private appendSpanToTail(text: string, color: string, bgColor?: string) {
    if (this.tailLineSpans.length === 0) {
      this.tailLineSpans.push({ text, color, bgColor });
      return;
    }

    const last = this.tailLineSpans[this.tailLineSpans.length - 1];
    if (last.color === color && last.bgColor === bgColor && last.text.length < this.maxSpanLength) {
      last.text += text;
    } else {
      this.tailLineSpans.push({ text, color, bgColor });
    }
  }

  /**
   * Commits the current tail line into the circular ring buffer.
   * When capacity (maxLines) is reached, overwrites oldest line at head in O(1).
   */
  private commitCurrentLine() {
    // Append newline to last span in current line
    if (this.tailLineSpans.length > 0) {
      this.tailLineSpans[this.tailLineSpans.length - 1].text += '\n';
    } else {
      this.tailLineSpans.push({ text: '\n', color: this.currentColor, bgColor: this.currentBgColor });
    }

    if (this.lineCount < this.maxLines) {
      const writeIdx = (this.head + this.lineCount) % this.maxLines;
      this.ring[writeIdx] = this.tailLineSpans;
      this.lineCount++;
    } else {
      // Ring buffer is full: overwrite the oldest line at head in O(1)
      this.ring[this.head] = this.tailLineSpans;
      this.head = (this.head + 1) % this.maxLines;
    }

    // Reset tail line for the next line (preserving stateful attributes)
    this.tailLineSpans = [];
  }
}
