/**
 * Asynchronous Input Queue for Turbo C++ Emulator
 * 
 * Separates the I/O processing loop from the UI rendering cycle.
 * Handles whitespace-delimited tokens (cin >> a >> b), full lines (gets/cin.getline),
 * and single keystrokes (getch/getche/getchar) without blocking the UI thread
 * or dropping input characters across rapid consecutive operations.
 */

export interface AsyncInputQueueOptions {
  onWaitingInput?: (waiting: boolean) => void;
  onWaitingKey?: (waiting: boolean) => void;
  onBeforeWait?: () => void;
}

export class AsyncInputQueue {
  private tokenBuffer: string[] = [];
  private keyBuffer: string[] = [];
  private pendingTokenReader: ((token: string) => void) | null = null;
  private pendingKeyReader: ((key: string) => void) | null = null;
  private isWaitingInput: boolean = false;
  private isWaitingKey: boolean = false;
  private isClosed: boolean = false;
  private options: AsyncInputQueueOptions;

  constructor(options: AsyncInputQueueOptions = {}) {
    this.options = options;
  }

  /**
   * Update listener callbacks
   */
  public setOptions(options: AsyncInputQueueOptions) {
    this.options = { ...this.options, ...options };
  }

  /**
   * User or UI submits an input line (from Enter key, software keyboard, or paste).
   * Parses line into whitespace-delimited tokens for cin/scanf and dispatches to pending reader.
   */
  public pushInput(line: string) {
    if (this.isClosed) return;

    const trimmed = line.trim();
    const tokens = trimmed ? trimmed.split(/\s+/) : [''];

    // Add tokens to buffer
    for (const t of tokens) {
      if (t.length > 0) {
        this.tokenBuffer.push(t);
      }
    }

    // If a reader was waiting for input
    if (this.pendingTokenReader) {
      const reader = this.pendingTokenReader;
      this.pendingTokenReader = null;
      this.setWaitingInputState(false);

      const nextToken = this.tokenBuffer.shift() ?? '0';

      // Dispatch resolution on a detached microtask to let UI render cycle finish cleanly
      queueMicrotask(() => {
        reader(nextToken);
      });
    }
  }

  /**
   * User or UI submits a single keypress (for getch / getche / getchar)
   */
  public pushKey(key: string) {
    if (this.isClosed) return;

    if (this.pendingKeyReader) {
      const reader = this.pendingKeyReader;
      this.pendingKeyReader = null;
      this.setWaitingKeyState(false);

      queueMicrotask(() => {
        reader(key);
      });
      return;
    }

    this.keyBuffer.push(key);
  }

  /**
   * Dequeues next whitespace-delimited token asynchronously.
   * If tokens are already queued, yields briefly to allow the UI to paint output and returns token.
   * If token buffer is empty, flushes output and signals UI that input is needed.
   */
  public async dequeueToken(): Promise<string> {
    if (this.isClosed) return '0';

    // If we already have tokens available (e.g. user typed multiple values or buffered input)
    if (this.tokenBuffer.length > 0) {
      // Yield to macrotask/microtask so the UI can paint any preceding cout text
      await new Promise(resolve => setTimeout(resolve, 0));
      return this.tokenBuffer.shift() ?? '0';
    }

    // Flush any pending output before asking the user for input
    this.options.onBeforeWait?.();
    this.setWaitingInputState(true);

    return new Promise<string>((resolve) => {
      this.pendingTokenReader = resolve;
    });
  }

  /**
   * Dequeues next single key asynchronously (for getch / getche)
   */
  public async dequeueKey(): Promise<string> {
    if (this.isClosed) return 'esc';

    if (this.keyBuffer.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      return this.keyBuffer.shift() ?? 'esc';
    }

    this.options.onBeforeWait?.();
    this.setWaitingKeyState(true);

    return new Promise<string>((resolve) => {
      this.pendingKeyReader = resolve;
    });
  }

  /**
   * Closes the queue (e.g. when execution breaks, halts, or finishes).
   * Unblocks any waiting promises immediately with safe default values.
   */
  public close() {
    this.isClosed = true;
    this.tokenBuffer = [];
    this.keyBuffer = [];

    if (this.pendingTokenReader) {
      const reader = this.pendingTokenReader;
      this.pendingTokenReader = null;
      reader('0');
    }

    if (this.pendingKeyReader) {
      const reader = this.pendingKeyReader;
      this.pendingKeyReader = null;
      reader('esc');
    }

    this.setWaitingInputState(false);
    this.setWaitingKeyState(false);
  }

  /**
   * Resets the queue state for a fresh execution run
   */
  public reset() {
    this.close();
    this.isClosed = false;
    this.tokenBuffer = [];
    this.keyBuffer = [];
    this.pendingTokenReader = null;
    this.pendingKeyReader = null;
    this.setWaitingInputState(false);
    this.setWaitingKeyState(false);
  }

  public get isWaitingForInput(): boolean {
    return this.isWaitingInput;
  }

  public get isWaitingForKey(): boolean {
    return this.isWaitingKey;
  }

  private setWaitingInputState(val: boolean) {
    if (this.isWaitingInput !== val) {
      this.isWaitingInput = val;
      this.options.onWaitingInput?.(val);
    }
  }

  private setWaitingKeyState(val: boolean) {
    if (this.isWaitingKey !== val) {
      this.isWaitingKey = val;
      this.options.onWaitingKey?.(val);
    }
  }
}
