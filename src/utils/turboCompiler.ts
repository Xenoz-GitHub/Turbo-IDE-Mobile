/**
 * Authentic Borland Turbo C++ 3.0 Compiler & Execution Engine
 * Evaluates real C/C++ syntax, conio.h, graphics.h (BGI), dos.h, iostream.h, and stdio.h
 * Emulates the 16-bit Borland compile -> link -> execute pipeline.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import { pcSpeaker } from './soundEngine';
import { AsyncInputQueue } from './asyncInputQueue';

export interface CompileResult {
  success: boolean;
  linesCompiled: number;
  warnings: string[];
  errors: string[];
  outputExe?: string;
  sourceName: string;
}

export interface ExecutionEvent {
  kind: 'text' | 'color' | 'gotoxy' | 'clear' | 'draw_circle' | 'draw_line' | 'draw_rect' | 'draw_bar' | 'draw_text' | 'draw_arc' | 'bg_color' | 'sound';
  text?: string;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  r?: number;
  color?: number;
  bgColor?: number;
  freq?: number;
}

export interface ConsoleOutputSpan {
  text: string;
  color: string;
  bgColor?: string;
}

// Authentic Borland 16-color EGA/VGA palette
export const BORLAND_COLOR_MAP: Record<number, string> = {
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
  15: '#FFFFFF', // WHITE (Default text color in authentic DOS)
};

interface UserFunction {
  returnType: string;
  name: string;
  params: { type: string; name: string }[];
  body: string;
}

export class TurboCompiler {
  private isHalted: boolean = false;
  private inputTokens: string[] = [];
  private activeInputQueue: AsyncInputQueue | null = null;
  private activeKeyQueue: AsyncInputQueue | null = null;
  private activeLegacyRequestInput: (() => Promise<string>) | null = null;
  private activeLegacyWaitForKey: (() => Promise<string>) | null = null;

  public breakExecution() {
    this.isHalted = true;
    this.inputTokens = [];
    if (this.activeInputQueue) {
      this.activeInputQueue.close();
    }
    if (this.activeKeyQueue) {
      this.activeKeyQueue.close();
    }
    pcSpeaker.nosound();
  }

  /**
   * Borland Turbo C++ 3.0 Syntax Validation & Pre-Compilation Pass
   * Deep syntax verification, preprocessor parsing, symbol resolution, and type checking
   */
  public compile(code: string, fileName: string): CompileResult {
    const rawLines = code.split('\n');
    const errors: string[] = [];
    const warnings: string[] = [];
    const includes: string[] = [];
    const declaredSymbols = new Set<string>([
      // Predefined Borland Turbo C++ constants
      'DETECT', 'VGA', 'VGAHI', 'EGA', 'EGAHI', 'CGA', 'C80', 'NULL', 'EOF', 'TRUE', 'FALSE', 'true', 'false',
      'BLACK', 'BLUE', 'GREEN', 'CYAN', 'RED', 'MAGENTA', 'BROWN', 'LIGHTGRAY',
      'DARKGRAY', 'LIGHTBLUE', 'LIGHTGREEN', 'LIGHTCYAN', 'LIGHTRED', 'LIGHTMAGENTA',
      'YELLOW', 'WHITE', 'CURRENT_COLOR', 'PI', 'BLINK',
      // Conio.h functions
      'clrscr', 'getch', 'getche', 'gotoxy', 'textcolor', 'textbackground', 'textattr', 'cprintf', 'cputs', 'cscanf',
      'wherex', 'wherey', 'delline', 'insline', 'highvideo', 'lowvideo', 'normvideo', 'window', 'kbhit', 'putch',
      // Stdio.h functions
      'printf', 'scanf', 'puts', 'gets', 'putchar', 'getchar', 'sprintf', 'sscanf',
      'fopen', 'fclose', 'fread', 'fwrite', 'fprintf', 'fscanf', 'fgets', 'fputs', 'fgetc', 'fputc',
      'feof', 'ferror', 'rewind', 'fseek', 'ftell', 'perror', 'remove', 'rename',
      'FILE', 'stdin', 'stdout', 'stderr',
      // Iostream.h / Fstream.h
      'cout', 'cin', 'cerr', 'clog', 'endl', 'ends', 'flush', 'hex', 'dec', 'oct', 'setw', 'setprecision',
      // Graphics.h functions & styles
      'initgraph', 'closegraph', 'circle', 'line', 'rectangle', 'bar', 'bar3d', 'arc', 'ellipse', 'fillellipse',
      'drawpoly', 'fillpoly', 'outtextxy', 'outtext', 'setcolor', 'setbkcolor', 'cleardevice',
      'getmaxx', 'getmaxy', 'getx', 'gety', 'moveto', 'moverel', 'lineto', 'linerel',
      'setfillstyle', 'settextstyle', 'floodfill', 'graphresult', 'grapherrormsg',
      'SOLID_FILL', 'LINE_FILL', 'DEFAULT_FONT', 'TRIPLEX_FONT',
      // Dos.h functions
      'delay', 'sound', 'nosound', 'sleep', 'inportb', 'outportb', 'inport', 'outport',
      'gettime', 'settime', 'getdate', 'setdate', 'int86', 'int86x', 'segread', 'geninterrupt',
      'enable', 'disable',
      // Stdlib.h / Math.h functions
      'sqrt', 'pow', 'abs', 'fabs', 'labs', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
      'floor', 'ceil', 'round', 'exp', 'log', 'log10', 'rand', 'srand', 'malloc', 'free', 'calloc', 'realloc',
      'exit', 'abort', 'system', 'atoi', 'atol', 'atof', 'div', 'ldiv', 'min', 'max', 'fmod',
      // String.h & Ctype.h
      'strlen', 'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp', 'strchr', 'strrchr', 'strstr',
      'toupper', 'tolower', 'isalpha', 'isdigit', 'isalnum', 'isspace', 'isupper', 'islower', 'ispunct', 'strupr', 'strlwr'
    ]);

    const validHeaders = [
      'stdio.h', 'conio.h', 'graphics.h', 'dos.h',
      'iostream.h', 'stdlib.h', 'math.h', 'string.h',
      'ctype.h', 'process.h', 'alloc.h', 'bios.h', 'dir.h', 'mem.h',
      'io.h', 'fcntl.h', 'time.h', 'fstream.h', 'iomanip.h'
    ];

    const typeKeywords = new Set([
      'void', 'int', 'float', 'double', 'char', 'long', 'short', 'unsigned', 'signed', 'bool', 'auto', 'FILE'
    ]);

    const controlKeywords = new Set([
      'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
      'goto', 'sizeof', 'typedef', 'struct', 'union', 'enum', 'class', 'public', 'private', 'protected',
      'template', 'virtual', 'inline', 'const', 'static', 'extern', 'register', 'volatile', 'catch', 'throw'
    ]);

    let hasMain = false;
    const braceStack: number[] = [];
    let inBlockComment = false;

    // First pass: collect declared variables, functions, structs, and symbols
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].replace(/\/\*.*?\*\//g, '').split('//')[0].trim();
      if (!line) continue;

      // 1. Collect function definitions & prototypes: e.g. int add(int a, float b)
      const fnMatch = line.match(/\b(?:void|int|float|double|char|long|short|bool)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
      if (fnMatch) {
        declaredSymbols.add(fnMatch[1]);
        if (fnMatch[2]) {
          const params = fnMatch[2].split(',');
          for (const p of params) {
            const pParts = p.trim().replace(/^\*+/, '').split(/\s+/);
            const pName = pParts[pParts.length - 1];
            if (pName && /^[a-zA-Z_]\w*$/.test(pName)) {
              declaredSymbols.add(pName);
            }
          }
        }
      }

      // 2. Collect class/struct definitions
      const classMatch = line.match(/\b(?:class|struct)\s+([a-zA-Z_]\w*)/);
      if (classMatch) {
        declaredSymbols.add(classMatch[1]);
      }

      // 3. Collect variable declarations: e.g. int a, b, sum; or float x = 1.0;
      const declMatch = line.match(/\b(?:int|float|double|char|long|short|unsigned|signed|bool|FILE)\b\s+([^;()]+)(?:;|\)|$)/);
      if (declMatch) {
        const declBody = declMatch[1];
        const items = declBody.split(',');
        for (const item of items) {
          const cleanItem = item.trim().replace(/^\*+/, '').split('=')[0].split('[')[0].trim();
          const varName = cleanItem.split(/\s+/).pop();
          if (varName && /^[a-zA-Z_]\w*$/.test(varName) && !typeKeywords.has(varName)) {
            declaredSymbols.add(varName);
          }
        }
      }

      // 4. Collect for-loop scoped variables: for (int i = 0; ...)
      const forDecl = line.match(/for\s*\(\s*(?:int|float|char|long)\s+([a-zA-Z_]\w*)/);
      if (forDecl) {
        declaredSymbols.add(forDecl[1]);
      }

      // 5. Preprocessor #define symbols
      const defMatch = line.match(/^#\s*define\s+([a-zA-Z_]\w*)/);
      if (defMatch) {
        declaredSymbols.add(defMatch[1]);
      }
    }

    // Second pass: deep line-by-line syntax & structure validation
    for (let idx = 0; idx < rawLines.length; idx++) {
      const lineNum = idx + 1;
      let line = rawLines[idx];

      if (inBlockComment) {
        const endCommentIdx = line.indexOf('*/');
        if (endCommentIdx !== -1) {
          inBlockComment = false;
          line = line.substring(endCommentIdx + 2);
        } else {
          continue;
        }
      }

      line = line.replace(/\/\*.*?\*\//g, '');
      const commentIdx = line.indexOf('//');
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      const startBlockComment = line.indexOf('/*');
      if (startBlockComment !== -1) {
        inBlockComment = true;
        line = line.substring(0, startBlockComment);
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      // 1. Preprocessor Directive Validation
      if (trimmed.startsWith('#')) {
        const prepMatch = trimmed.match(/^#\s*(include|define|undef|ifdef|ifndef|if|else|elif|endif|pragma|error)\b(.*)$/);
        if (!prepMatch) {
          errors.push(`Error ${fileName} ${lineNum}: Bad preprocessor directive syntax`);
          continue;
        }

        const directive = prepMatch[1];
        const rest = prepMatch[2].trim();

        if (directive === 'include') {
          const incMatch = rest.match(/^[<"]([^>"]+)[>"]/);
          if (!incMatch) {
            errors.push(`Error ${fileName} ${lineNum}: Expected include file name`);
          } else {
            const header = incMatch[1].toLowerCase();
            includes.push(header);
            if (!validHeaders.includes(header)) {
              errors.push(`Error ${fileName} ${lineNum}: Unable to open include file '${incMatch[1]}'`);
            }
          }
        } else if (directive === 'define') {
          const defMatch = rest.match(/^([a-zA-Z_]\w*)(?:\s+(.*))?$/);
          if (defMatch) {
            declaredSymbols.add(defMatch[1]);
          }
        }
        continue;
      }

      // 2. String and Character Literal Check
      let inString = false;
      let inChar = false;
      for (let c = 0; c < trimmed.length; c++) {
        const ch = trimmed[c];
        const prev = c > 0 ? trimmed[c - 1] : '';
        if (ch === '"' && prev !== '\\') {
          if (!inChar) inString = !inString;
        } else if (ch === "'" && prev !== '\\') {
          if (!inString) inChar = !inChar;
        }
      }
      if (inString || inChar) {
        errors.push(`Error ${fileName} ${lineNum}: Unterminated string or character constant`);
        continue;
      }

      // 3. Parentheses and Brackets Balance Check on Statement
      let parenCount = 0;
      let bracketCount = 0;
      let strMode = false;
      for (let c = 0; c < trimmed.length; c++) {
        const ch = trimmed[c];
        const prev = c > 0 ? trimmed[c - 1] : '';
        if (ch === '"' && prev !== '\\') strMode = !strMode;
        if (!strMode) {
          if (ch === '(') parenCount++;
          if (ch === ')') parenCount--;
          if (ch === '[') bracketCount++;
          if (ch === ']') bracketCount--;
        }
      }
      if (parenCount !== 0) {
        errors.push(`Error ${fileName} ${lineNum}: Expression syntax`);
      }
      if (bracketCount !== 0) {
        errors.push(`Error ${fileName} ${lineNum}: Bad syntax in array reference`);
      }

      // 4. Curly Braces Tracking
      for (const char of trimmed) {
        if (char === '{') {
          braceStack.push(lineNum);
        } else if (char === '}') {
          if (braceStack.length === 0) {
            errors.push(`Error ${fileName} ${lineNum}: Extra '}'`);
          } else {
            braceStack.pop();
          }
        }
      }

      // 5. Entry point check: main()
      if (trimmed.match(/\b(?:void|int)\s+main\s*\([^)]*\)/) || trimmed.match(/^main\s*\([^)]*\)/)) {
        hasMain = true;
      }

      // 6. Stray illegal characters outside of strings
      const nonString = trimmed.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '');
      const illegalMatch = nonString.match(/[@$`\\]/);
      if (illegalMatch) {
        errors.push(`Error ${fileName} ${lineNum}: Illegal character '${illegalMatch[0]}'`);
      }

      // 7. Semicolon & Statement Completion Validation
      const isControlHeader = trimmed.startsWith('for') ||
                              trimmed.startsWith('while') ||
                              trimmed.startsWith('if') ||
                              trimmed.startsWith('else') ||
                              trimmed.startsWith('switch') ||
                              trimmed.startsWith('do') ||
                              trimmed.startsWith('case ') ||
                              trimmed.startsWith('case\t') ||
                              trimmed.startsWith('default:') ||
                              trimmed.endsWith(':');

      const isBlockOrDef = trimmed.endsWith('{') ||
                           trimmed.endsWith('}') ||
                           trimmed.startsWith('class ') ||
                           trimmed.startsWith('struct ') ||
                           trimmed.startsWith('public:') ||
                           trimmed.startsWith('private:');

      const isFunctionHeader = /\b(void|int|float|double|char|long)\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*$/.test(trimmed);

      if (!isControlHeader && !isBlockOrDef && !isFunctionHeader) {
        if (!trimmed.endsWith(';')) {
          errors.push(`Error ${fileName} ${lineNum}: Statement missing ;`);
        } else {
          const beforeSemicolon = trimmed.slice(0, -1).trim();
          if (/[=+\-*/%,<>|&^!~]$/.test(beforeSemicolon)) {
            errors.push(`Error ${fileName} ${lineNum}: Expression syntax`);
          }
        }
      }

      // 8. Borland Symbol & Function Call Resolution
      const codeNoStrings = trimmed
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
        .replace(/'(?:\\.|[^'\\])*'/g, "''");

      if (/\bcout\s*<(?![<=])/.test(codeNoStrings)) {
        errors.push(`Error ${fileName} ${lineNum}: Expression syntax (stream insertion requires '<<')`);
      }
      if (/\bcin\s*>(?![>=])/.test(codeNoStrings)) {
        errors.push(`Error ${fileName} ${lineNum}: Expression syntax (stream extraction requires '>>')`);
      }

      // Check function calls
      const callMatches = codeNoStrings.matchAll(/\b([a-zA-Z_]\w*)\s*\(/g);
      for (const cm of callMatches) {
        const fnName = cm[1];
        if (
          !controlKeywords.has(fnName) &&
          !typeKeywords.has(fnName) &&
          fnName !== 'main' &&
          !declaredSymbols.has(fnName)
        ) {
          errors.push(`Error ${fileName} ${lineNum}: Call to undefined function '${fnName}'`);
        }
      }

      // Check assignments to undeclared variables
      const isDeclLine = Array.from(typeKeywords).some(t => new RegExp(`\\b${t}\\b`).test(trimmed));
      if (!isDeclLine && !isControlHeader) {
        const assignMatch = codeNoStrings.match(/^([a-zA-Z_]\w*)\s*(?:=|\+=|-=|\*=|\/=|%=|\+\+|--)(?!=)/);
        if (assignMatch) {
          const varName = assignMatch[1];
          if (!declaredSymbols.has(varName) && !controlKeywords.has(varName) && !typeKeywords.has(varName)) {
            errors.push(`Error ${fileName} ${lineNum}: Undefined symbol '${varName}'`);
          }
        }
      }
    }

    if (braceStack.length > 0) {
      errors.push(`Error ${fileName} ${braceStack[braceStack.length - 1]}: Compound statement missing '}'`);
    }

    if (!hasMain) {
      errors.push(`Error ${fileName}: Undefined symbol '_main' in module ${fileName}`);
    }

    if (!includes.includes('conio.h') && (code.includes('clrscr') || code.includes('getch') || code.includes('cprintf') || code.includes('textcolor'))) {
      warnings.push(`Warning ${fileName}: Function 'clrscr'/'getch' should have a prototype in conio.h`);
    }
    if (!includes.includes('stdio.h') && (code.includes('printf') || code.includes('scanf'))) {
      warnings.push(`Warning ${fileName}: Function 'printf'/'scanf' should have a prototype in stdio.h`);
    }
    if (!includes.includes('iostream.h') && (code.includes('cout') || code.includes('cin'))) {
      warnings.push(`Warning ${fileName}: Function 'cout'/'cin' should have a prototype in iostream.h`);
    }

    const success = errors.length === 0;
    const exeName = fileName.replace(/\.(c|cpp)$/i, '.EXE');

    return {
      success,
      linesCompiled: rawLines.length,
      warnings,
      errors,
      outputExe: success ? `D:\\OUT\\${exeName}` : undefined,
      sourceName: fileName
    };
  }

  /**
   * Executes arbitrary C/C++ program simulating Turbo C++ runtime
   * Default text output color is WHITE (#FFFFFF, index 15) unless textcolor() is explicitly called!
   * Fully supports interactive cin >> input, scanf, clearscreen (clrscr), switch/case, loops, math, and heavy algorithms.
   */
  public async execute(
    code: string,
    onEvent: (event: ExecutionEvent) => void,
    onComplete: () => void,
    inputSource?: AsyncInputQueue | (() => Promise<string>),
    keySource?: AsyncInputQueue | (() => Promise<string>)
  ) {
    this.isHalted = false;
    this.inputTokens = [];

    if (inputSource instanceof AsyncInputQueue) {
      this.activeInputQueue = inputSource;
      this.activeLegacyRequestInput = null;
    } else if (typeof inputSource === 'function') {
      this.activeInputQueue = null;
      this.activeLegacyRequestInput = inputSource;
    } else {
      this.activeInputQueue = null;
      this.activeLegacyRequestInput = null;
    }

    if (keySource instanceof AsyncInputQueue) {
      this.activeKeyQueue = keySource;
      this.activeLegacyWaitForKey = null;
    } else if (typeof keySource === 'function') {
      this.activeKeyQueue = null;
      this.activeLegacyWaitForKey = keySource;
    } else {
      this.activeKeyQueue = null;
      this.activeLegacyWaitForKey = null;
    }

    // Clear previous screen
    onEvent({ kind: 'clear' });

    // Variables environment: Preload 16 Borland EGA/VGA colors and hardware constants
    // CURRENT_COLOR defaults to 15 (WHITE) in authentic DOS!
    const vars: Record<string, any> = {
      DETECT: 0,
      BLACK: 0,
      BLUE: 1,
      GREEN: 2,
      CYAN: 3,
      RED: 4,
      MAGENTA: 5,
      BROWN: 6,
      LIGHTGRAY: 7,
      DARKGRAY: 8,
      LIGHTBLUE: 9,
      LIGHTGREEN: 10,
      LIGHTCYAN: 11,
      LIGHTRED: 12,
      LIGHTMAGENTA: 13,
      YELLOW: 14,
      WHITE: 15,
      CURRENT_COLOR: 15, // Default is WHITE
      CURRENT_BG: 0,    // Default is BLACK
      NULL: 0,
      EOF: -1,
      TRUE: 1,
      FALSE: 0,
      true: 1,
      false: 0,
      PI: 3.141592653589793
    };

    // Clean comments
    const cleanCode = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    // Extract user-defined helper functions (outside main)
    const userFunctions: Record<string, UserFunction> = {};
    const fnRegex = /\b(?:void|int|float|double|char|long|bool)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
    let match: RegExpExecArray | null;
    while ((match = fnRegex.exec(cleanCode)) !== null) {
      if (match[1] !== 'main') {
        const params = match[2].trim()
          ? match[2].split(',').map(p => {
              const parts = p.trim().split(/\s+/);
              return { type: parts[0], name: parts[parts.length - 1].replace(/^\*+/, '').replace(/^&+/, '') };
            })
          : [];
        userFunctions[match[1]] = {
          returnType: 'int',
          name: match[1],
          params,
          body: match[3]
        };
      }
    }

    // Extract main body
    const mainMatch = cleanCode.match(/(?:void|int)?\s*main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
    if (!mainMatch) {
      onEvent({ kind: 'text', text: 'Error: Cannot find entry point main().\n', color: 12 });
      onComplete();
      return;
    }

    const body = mainMatch[1];
    const statements = this.splitStatements(body);

    const reqInput = typeof inputSource === 'function' ? inputSource : undefined;
    const waitKey = typeof keySource === 'function' ? keySource : undefined;

    for (let i = 0; i < statements.length; i++) {
      if (this.isHalted) break;
      const stmt = statements[i].trim();
      if (!stmt) continue;

      try {
        await this.evalStatement(stmt, vars, userFunctions, onEvent, reqInput, waitKey);
      } catch (err: any) {
        onEvent({ kind: 'text', text: `\n[Runtime Error: ${err?.message || 'Execution error'}]\n`, color: 12 });
        break;
      }
    }

    pcSpeaker.nosound();
    onComplete();
  }

  /**
   * Helper to retrieve next input token from interactive prompt
   */
  private async getNextInputToken(
    requestInput?: () => Promise<string>,
    onEvent?: (event: ExecutionEvent) => void,
    currentColor: number = 15
  ): Promise<string> {
    if (this.isHalted) return '0';

    if (this.activeInputQueue) {
      return await this.activeInputQueue.dequeueToken();
    }

    const inputFn = requestInput || this.activeLegacyRequestInput;
    while (this.inputTokens.length === 0) {
      if (this.isHalted) return '0';
      if (!inputFn) return '0';

      const line = await inputFn();
      if (line === null || line === undefined) return '0';

      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      this.inputTokens = trimmed.split(/\s+/);
    }
    return this.inputTokens.shift() || '0';
  }

  /**
   * Splits statements respecting nested braces and quoted strings
   */
  private splitStatements(code: string): string[] {
    const list: string[] = [];
    let current = '';
    let braceDepth = 0;
    let parenDepth = 0;
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < code.length; i++) {
      const c = code[i];

      if ((c === '"' || c === "'") && code[i - 1] !== '\\') {
        if (!inQuote) {
          inQuote = true;
          quoteChar = c;
        } else if (c === quoteChar) {
          inQuote = false;
        }
      }

      if (!inQuote) {
        if (c === '(') parenDepth++;
        if (c === ')') parenDepth = Math.max(0, parenDepth - 1);
        if (c === '{') braceDepth++;
        if (c === '}') braceDepth = Math.max(0, braceDepth - 1);

        // Split on semicolon at top depth
        if (c === ';' && braceDepth === 0 && parenDepth === 0) {
          const s = current.trim();
          if (s) list.push(s);
          current = '';
          continue;
        }

        // Split on closing brace at top depth
        if (c === '}' && braceDepth === 0 && parenDepth === 0) {
          current += c;
          const s = current.trim();
          if (s) list.push(s);
          current = '';
          continue;
        }
      }

      current += c;
    }

    if (current.trim()) list.push(current.trim());
    return list;
  }

  /**
   * Executes a statement with full support for if/else, loops, switch-case, declarations, expressions, and I/O
   */
  private async evalStatement(
    stmt: string,
    vars: Record<string, any>,
    userFunctions: Record<string, UserFunction>,
    onEvent: (event: ExecutionEvent) => void,
    requestInput?: () => Promise<string>,
    waitForKey?: () => Promise<string>
  ): Promise<any> {
    if (this.isHalted) return;
    const trimmed = stmt.trim();
    if (!trimmed) return;

    const currentColor = vars['CURRENT_COLOR'] ?? 15; // White default
    const currentBg = vars['CURRENT_BG'] ?? 0;

    // Handle return statements: return expr;
    if (trimmed.startsWith('return')) {
      const expr = trimmed.replace(/^return\s*/, '').replace(/;$/, '').trim();
      return expr ? this.evalExpr(expr, vars, userFunctions) : 0;
    }

    // clrscr() / cleardevice() (conio.h / graphics.h)
    if (trimmed.includes('clrscr()') || trimmed.includes('cleardevice()')) {
      onEvent({ kind: 'clear' });
      return;
    }

    // textcolor(c)
    const tcMatch = trimmed.match(/textcolor\s*\(([^)]+)\)/);
    if (tcMatch) {
      const colorVal = Number(this.evalExpr(tcMatch[1], vars, userFunctions)) || 15;
      vars['CURRENT_COLOR'] = colorVal;
      onEvent({ kind: 'color', color: colorVal });
      return;
    }

    // textbackground(c)
    const bgMatch = trimmed.match(/textbackground\s*\(([^)]+)\)/);
    if (bgMatch) {
      const bgVal = Number(this.evalExpr(bgMatch[1], vars, userFunctions)) || 0;
      vars['CURRENT_BG'] = bgVal;
      onEvent({ kind: 'bg_color', bgColor: bgVal });
      return;
    }

    // gotoxy(x, y)
    const gotoMatch = trimmed.match(/gotoxy\s*\(([^,]+),\s*([^)]+)\)/);
    if (gotoMatch) {
      const x = Number(this.evalExpr(gotoMatch[1], vars, userFunctions)) || 1;
      const y = Number(this.evalExpr(gotoMatch[2], vars, userFunctions)) || 1;
      onEvent({ kind: 'gotoxy', x, y });
      return;
    }

    // getch() / getche() / getchar()
    if (trimmed.includes('getch()') || trimmed.includes('getche()') || trimmed.includes('getchar()')) {
      let k = ' ';
      if (this.activeKeyQueue) {
        k = await this.activeKeyQueue.dequeueKey();
      } else if (this.activeInputQueue) {
        k = await this.activeInputQueue.dequeueKey();
      } else if (waitForKey || this.activeLegacyWaitForKey) {
        const keyFn = waitForKey || this.activeLegacyWaitForKey;
        if (keyFn) k = await keyFn();
      }
      if (trimmed.includes('getche()')) {
        onEvent({ kind: 'text', text: k, color: currentColor, bgColor: currentBg });
      }
      return;
    }

    // sound(freq)
    const soundMatch = trimmed.match(/sound\s*\(([^)]+)\)/);
    if (soundMatch) {
      const freq = Number(this.evalExpr(soundMatch[1], vars, userFunctions)) || 440;
      pcSpeaker.sound(freq);
      onEvent({ kind: 'sound', freq });
      return;
    }

    // nosound()
    if (trimmed.includes('nosound()')) {
      pcSpeaker.nosound();
      return;
    }

    // delay(ms) or sleep(sec)
    const delayMatch = trimmed.match(/delay\s*\(([^)]+)\)/);
    if (delayMatch) {
      const ms = Math.min(Number(this.evalExpr(delayMatch[1], vars, userFunctions)) || 50, 1500);
      await new Promise(r => setTimeout(r, ms));
      return;
    }

    // cout << ... (C++ Stream Output)
    if (trimmed.startsWith('cout')) {
      const parts = this.splitStreamTokens(trimmed.replace(/^cout\s*<<\s*/, ''));
      let outputText = '';
      for (const p of parts) {
        if (p === 'endl') {
          outputText += '\n';
        } else if (p.startsWith('"') && p.endsWith('"')) {
          outputText += p.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '    ');
        } else if (vars[p] !== undefined) {
          outputText += String(vars[p]);
        } else {
          outputText += String(this.evalExpr(p, vars, userFunctions));
        }
      }
      // Output in current color (Default: WHITE)
      onEvent({ kind: 'text', text: outputText, color: currentColor, bgColor: currentBg });
      return;
    }

    // cin >> ... (C++ Interactive Stream Input)
    if (trimmed.startsWith('cin')) {
      const varNames = trimmed.replace(/^cin\s*>>\s*/, '').split('>>').map(s => s.trim().replace(/;$/, ''));
      for (const v of varNames) {
        if (!v) continue;
        const rawToken = await this.getNextInputToken(requestInput, onEvent, currentColor);

        // Determine expected type from variable declaration
        const varType = this.getVariableType(v, vars);
        
        // Validate input based on variable type
        if (varType === 'int' || varType === 'float' || varType === 'double' || varType === 'long') {
          // Numeric types - must be a valid number
          if (isNaN(Number(rawToken)) || rawToken.trim() === '') {
            // Input validation failed - simulate cin failure
            onEvent({ 
              kind: 'text', 
              text: `\n\nRuntime Error: Invalid input!\nExpected a number for variable '${v}', got: '${rawToken}'\n\nProgram terminated.\n`, 
              color: '#FF5555', 
              bgColor: currentBg 
            });
            throw new Error(`Invalid input: Expected number for '${v}', got '${rawToken}'`);
          }
          vars[v] = Number(rawToken);
        } else if (varType === 'char') {
          // Character type - take first character
          vars[v] = rawToken.charAt(0) || '\0';
        } else {
          // String or unknown type - accept as is
          vars[v] = rawToken;
        }
      }
      // Separate I/O processing loop from the UI rendering cycle
      await new Promise(r => setTimeout(r, 0));
      return;
    }

    // printf("...", ...) (C Standard Output)
    const printfMatch = trimmed.match(/printf\s*\((.*)\)/);
    if (printfMatch) {
      const args = this.splitArgs(printfMatch[1]);
      let fmt = args[0] ? this.cleanFormatString(args[0]) : '';
      for (let k = 1; k < args.length; k++) {
        const val = this.evalExpr(args[k], vars, userFunctions);
        fmt = this.applyFormatSpecifier(fmt, val);
      }
      onEvent({ kind: 'text', text: fmt, color: currentColor, bgColor: currentBg });
      return;
    }

    // cprintf("...", ...) (Borland Color Console Output)
    const cprintfMatch = trimmed.match(/cprintf\s*\((.*)\)/);
    if (cprintfMatch) {
      const args = this.splitArgs(cprintfMatch[1]);
      let fmt = args[0] ? this.cleanFormatString(args[0]) : '';
      for (let k = 1; k < args.length; k++) {
        const val = this.evalExpr(args[k], vars, userFunctions);
        fmt = this.applyFormatSpecifier(fmt, val);
      }
      onEvent({ kind: 'text', text: fmt, color: currentColor, bgColor: currentBg });
      return;
    }

    // scanf("...", ...) (C Standard Input)
    const scanfMatch = trimmed.match(/scanf\s*\((.*)\)/);
    if (scanfMatch) {
      const args = this.splitArgs(scanfMatch[1]);
      const format = args[0] ? this.cleanFormatString(args[0]) : '';
      
      for (let k = 1; k < args.length; k++) {
        const targetVar = args[k].replace(/^&/, '').trim();
        const rawToken = await this.getNextInputToken(requestInput, onEvent, currentColor);
        
        // Determine expected type from format specifier or variable type
        const formatSpec = this.extractFormatSpecifier(format, k - 1);
        const varType = this.getVariableType(targetVar, vars);
        
        // Validate input based on format specifier or variable type
        if (formatSpec === '%d' || formatSpec === '%i' || formatSpec === '%f' || formatSpec === '%lf' || 
            varType === 'int' || varType === 'float' || varType === 'double' || varType === 'long') {
          // Numeric input expected
          if (isNaN(Number(rawToken)) || rawToken.trim() === '') {
            // Input validation failed
            onEvent({ 
              kind: 'text', 
              text: `\n\nRuntime Error: Invalid input!\nExpected a number for variable '${targetVar}', got: '${rawToken}'\n\nProgram terminated.\n`, 
              color: '#FF5555', 
              bgColor: currentBg 
            });
            throw new Error(`Invalid input: Expected number for '${targetVar}', got '${rawToken}'`);
          }
          vars[targetVar] = Number(rawToken);
        } else if (formatSpec === '%c' || varType === 'char') {
          // Character input
          vars[targetVar] = rawToken.charAt(0) || '\0';
        } else {
          // String or unknown - accept as is
          vars[targetVar] = rawToken;
        }
      }
      // Separate I/O processing loop from the UI rendering cycle
      await new Promise(r => setTimeout(r, 0));
      return;
    }

    // puts("...")
    const putsMatch = trimmed.match(/puts\s*\((.*)\)/);
    if (putsMatch) {
      const arg = putsMatch[1].replace(/^"|"$/g, '');
      onEvent({ kind: 'text', text: `${arg}\n`, color: currentColor, bgColor: currentBg });
      return;
    }

    // gets(str)
    const getsMatch = trimmed.match(/gets\s*\((.*)\)/);
    if (getsMatch) {
      const targetVar = getsMatch[1].trim();
      if (requestInput) {
        const line = await requestInput();
        vars[targetVar] = line || '';
      }
      return;
    }

    // switch / case / default / break
    if (trimmed.startsWith('switch')) {
      await this.evalSwitch(trimmed, vars, userFunctions, onEvent, requestInput, waitForKey);
      return;
    }

    // if-else statements: if (cond) { ... } else { ... }
    if (trimmed.startsWith('if')) {
      const ifMatch = trimmed.match(/^if\s*\(([\s\S]*?)\)\s*(\{[\s\S]*?\}|[^{;]+;?)(?:\s*else\s*(\{[\s\S]*?\}|[^{;]+;?))?$/);
      if (ifMatch) {
        const condition = ifMatch[1];
        const thenBranch = ifMatch[2].replace(/^\{|\}$/g, '').trim();
        const elseBranch = ifMatch[3] ? ifMatch[3].replace(/^\{|\}$/g, '').trim() : null;

        const isTrue = this.evalCondition(condition, vars, userFunctions);
        if (isTrue) {
          const innerStmts = this.splitStatements(thenBranch);
          for (const s of innerStmts) {
            if (this.isHalted) break;
            const res = await this.evalStatement(s, vars, userFunctions, onEvent, requestInput, waitForKey);
            if (res !== undefined) return res;
          }
        } else if (elseBranch) {
          const innerStmts = this.splitStatements(elseBranch);
          for (const s of innerStmts) {
            if (this.isHalted) break;
            const res = await this.evalStatement(s, vars, userFunctions, onEvent, requestInput, waitForKey);
            if (res !== undefined) return res;
          }
        }
        return;
      }
    }

    // for loops: for (init; cond; step) { ... }
    const forMatch = trimmed.match(/^for\s*\(\s*([^;]*);\s*([^;]*);\s*([^)]*)\)\s*(\{[\s\S]*\}|[^{;]+;?)$/);
    if (forMatch) {
      const initPart = forMatch[1].trim();
      const condPart = forMatch[2].trim();
      const stepPart = forMatch[3].trim();
      const bodyPart = forMatch[4].replace(/^\{|\}$/g, '').trim();

      if (initPart) {
        await this.evalStatement(initPart, vars, userFunctions, onEvent, requestInput, waitForKey);
      }

      const innerStmts = this.splitStatements(bodyPart);
      let iterations = 0;

      while ((!condPart || this.evalCondition(condPart, vars, userFunctions)) && !this.isHalted) {
        iterations++;
        // Periodic yield every 50 iterations to allow non-blocking UI rendering and responsive Break / Stop
        if (iterations % 50 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }

        let shouldBreak = false;
        for (const inner of innerStmts) {
          if (this.isHalted) break;
          if (inner.trim() === 'break') {
            shouldBreak = true;
            break;
          }
          if (inner.trim() === 'continue') {
            break;
          }
          const res = await this.evalStatement(inner, vars, userFunctions, onEvent, requestInput, waitForKey);
          if (res !== undefined) return res;
        }

        if (shouldBreak) break;
        if (stepPart) {
          this.evalStep(stepPart, vars, userFunctions);
        }
      }
      return;
    }

    // while loops: while (cond) { ... }
    const whileMatch = trimmed.match(/^while\s*\(([^)]+)\)\s*(\{[\s\S]*\}|[^{;]+;?)$/);
    if (whileMatch) {
      const condition = whileMatch[1].trim();
      const bodyPart = whileMatch[2].replace(/^\{|\}$/g, '').trim();
      const innerStmts = this.splitStatements(bodyPart);

      let iterations = 0;

      while (this.evalCondition(condition, vars, userFunctions) && !this.isHalted) {
        iterations++;
        if (iterations % 50 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }

        let shouldBreak = false;
        for (const inner of innerStmts) {
          if (this.isHalted) break;
          if (inner.trim() === 'break') {
            shouldBreak = true;
            break;
          }
          if (inner.trim() === 'continue') {
            break;
          }
          const res = await this.evalStatement(inner, vars, userFunctions, onEvent, requestInput, waitForKey);
          if (res !== undefined) return res;
        }

        if (shouldBreak) break;
      }
      return;
    }

    // do-while loops: do { ... } while (cond);
    const doWhileMatch = trimmed.match(/^do\s*\{([\s\S]*?)\}\s*while\s*\(([^)]+)\);?/);
    if (doWhileMatch) {
      const loopBody = doWhileMatch[1];
      const condition = doWhileMatch[2];
      const innerStmts = this.splitStatements(loopBody);

      let iterations = 0;

      do {
        iterations++;
        if (iterations % 50 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }

        let shouldBreak = false;
        for (const inner of innerStmts) {
          if (this.isHalted) break;
          if (inner.trim() === 'break') {
            shouldBreak = true;
            break;
          }
          if (inner.trim() === 'continue') {
            break;
          }
          const res = await this.evalStatement(inner, vars, userFunctions, onEvent, requestInput, waitForKey);
          if (res !== undefined) return res;
        }

        if (shouldBreak) break;
      } while (this.evalCondition(condition, vars, userFunctions) && !this.isHalted);
      return;
    }

    // Array declarations: int notes[] = { 261, 293, ... }; or int arr[10];
    const arrayDeclMatch = trimmed.match(/^(?:int|float|double|char|long)\s+([a-zA-Z_]\w*)\s*\[\s*(\d*)\s*\](?:\s*=\s*\{([^}]+)\})?/);
    if (arrayDeclMatch) {
      const arrName = arrayDeclMatch[1];
      const size = Number(arrayDeclMatch[2]) || 0;
      if (arrayDeclMatch[3]) {
        const rawElements = arrayDeclMatch[3].split(',').map(s => {
          const ev = this.evalExpr(s.trim(), vars, userFunctions);
          return typeof ev === 'number' ? ev : 0;
        });
        vars[arrName] = rawElements;
      } else {
        vars[arrName] = new Array(size || 10).fill(0);
      }
      return;
    }

    // Variable declarations: e.g. int a, b, sum; or float x = 1.0, y = 2.0;
    const varDeclMatch = trimmed.match(/^(?:int|float|double|char|long|short|unsigned|bool)\s+(.+)$/);
    if (varDeclMatch) {
      const declList = varDeclMatch[1].replace(/;$/, '');
      const parts = this.splitArgs(declList);
      for (const p of parts) {
        const eqIdx = p.indexOf('=');
        if (eqIdx !== -1) {
          const name = p.slice(0, eqIdx).trim();
          const expr = p.slice(eqIdx + 1).trim();
          vars[name] = this.evalExpr(expr, vars, userFunctions);
        } else {
          const name = p.trim();
          if (vars[name] === undefined) {
            vars[name] = 0; // Default initialized to 0
          }
        }
      }
      return;
    }

    // Array element assignment: arr[i] = val; or arr[i][j] = val;
    const arrayAssignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=\s*(.+)$/);
    if (arrayAssignMatch) {
      const arrName = arrayAssignMatch[1];
      const idx = Number(this.evalExpr(arrayAssignMatch[2], vars, userFunctions)) || 0;
      const val = this.evalExpr(arrayAssignMatch[3], vars, userFunctions);
      if (Array.isArray(vars[arrName])) {
        vars[arrName][idx] = val;
      }
      return;
    }

    // Compound assignment: salary += 1000;
    const compoundMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*([+\-*/%])=\s*(.+)$/);
    if (compoundMatch) {
      const name = compoundMatch[1];
      const op = compoundMatch[2];
      const val = this.evalExpr(compoundMatch[3], vars, userFunctions);
      if (vars[name] !== undefined) {
        if (op === '+') vars[name] += val;
        if (op === '-') vars[name] -= val;
        if (op === '*') vars[name] *= val;
        if (op === '/') {
          if (val === 0) throw new Error('Division by zero');
          vars[name] = Math.floor(vars[name] / val);
        }
        if (op === '%') {
          if (val === 0) throw new Error('Division by zero in modulo');
          vars[name] = vars[name] % val;
        }
      }
      return;
    }

    // Increment / Decrement: i++; ++i; i--; --i;
    const incMatch = trimmed.match(/^(\+\+|--)?\s*([a-zA-Z_]\w*)\s*(\+\+|--)?$/);
    if (incMatch && (incMatch[1] || incMatch[3])) {
      const name = incMatch[2];
      const isInc = incMatch[1] === '++' || incMatch[3] === '++';
      if (vars[name] !== undefined) {
        vars[name] += isInc ? 1 : -1;
      }
      return;
    }

    // Standard assignment: sum = a + b;
    const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const name = assignMatch[1];
      vars[name] = this.evalExpr(assignMatch[2], vars, userFunctions);
      return;
    }

    // Function calls as statements: e.g. customFn(a, b);
    const fnCallMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*\((.*)\)$/);
    if (fnCallMatch && userFunctions[fnCallMatch[1]]) {
      await this.callUserFunction(userFunctions[fnCallMatch[1]], fnCallMatch[2], vars, userFunctions, onEvent, requestInput, waitForKey);
      return;
    }

    // Graphics BGI commands
    this.handleGraphicsCommand(trimmed, vars, userFunctions, onEvent);
  }

  /**
   * Evaluates switch-case-default control structures
   */
  private async evalSwitch(
    stmt: string,
    vars: Record<string, any>,
    userFunctions: Record<string, UserFunction>,
    onEvent: (event: ExecutionEvent) => void,
    requestInput?: () => Promise<string>,
    waitForKey?: () => Promise<string>
  ) {
    const switchMatch = stmt.match(/^switch\s*\(([^)]+)\)\s*\{([\s\S]*)\}$/);
    if (!switchMatch) return;

    const switchVal = this.evalExpr(switchMatch[1], vars, userFunctions);
    const body = switchMatch[2];

    // Split body into case/default chunks
    const rawLines = body.split('\n');
    interface CaseBlock {
      caseExpr?: string;
      isDefault: boolean;
      statements: string[];
    }

    const blocks: CaseBlock[] = [];
    let currentBlock: CaseBlock | null = null;

    for (const r of rawLines) {
      const line = r.trim();
      if (!line) continue;

      const caseMatch = line.match(/^case\s+([^:]+):(.*)$/);
      const defaultMatch = line.match(/^default\s*:(.*)$/);

      if (caseMatch) {
        currentBlock = { caseExpr: caseMatch[1].trim(), isDefault: false, statements: [] };
        blocks.push(currentBlock);
        if (caseMatch[2].trim()) {
          currentBlock.statements.push(caseMatch[2].trim());
        }
      } else if (defaultMatch) {
        currentBlock = { isDefault: true, statements: [] };
        blocks.push(currentBlock);
        if (defaultMatch[1].trim()) {
          currentBlock.statements.push(defaultMatch[1].trim());
        }
      } else if (currentBlock) {
        currentBlock.statements.push(line);
      }
    }

    // Find starting block index
    let startIndex = -1;
    let defaultIndex = -1;

    for (let b = 0; b < blocks.length; b++) {
      if (blocks[b].isDefault) {
        defaultIndex = b;
      } else if (blocks[b].caseExpr !== undefined) {
        const val = this.evalExpr(blocks[b].caseExpr!, vars, userFunctions);
        if (val === switchVal) {
          startIndex = b;
          break;
        }
      }
    }

    if (startIndex === -1) {
      startIndex = defaultIndex;
    }

    if (startIndex !== -1) {
      for (let b = startIndex; b < blocks.length; b++) {
        if (this.isHalted) break;
        const blockCode = blocks[b].statements.join('\n');
        const stmts = this.splitStatements(blockCode);
        let hitBreak = false;
        for (const s of stmts) {
          if (this.isHalted) break;
          if (s.trim() === 'break') {
            hitBreak = true;
            break;
          }
          await this.evalStatement(s, vars, userFunctions, onEvent, requestInput, waitForKey);
        }
        if (hitBreak) break;
      }
    }
  }

  /**
   * Evaluates expressions supporting variables, arithmetic, functions, and arrays
   */
  private evalExpr(expr: string, vars: Record<string, any>, userFunctions?: Record<string, UserFunction>): any {
    let trimmed = expr.trim().replace(/;$/, '');
    if (vars[trimmed] !== undefined && !Array.isArray(vars[trimmed])) return vars[trimmed];
    if (!isNaN(Number(trimmed))) return Number(trimmed);

    // Replace getmaxx() and getmaxy() with 640 and 480
    trimmed = trimmed.replace(/getmaxx\s*\(\s*\)/g, '640');
    trimmed = trimmed.replace(/getmaxy\s*\(\s*\)/g, '480');

    // Math functions
    trimmed = trimmed.replace(/\bsqrt\s*\(/g, 'Math.sqrt(');
    trimmed = trimmed.replace(/\bpow\s*\(/g, 'Math.pow(');
    trimmed = trimmed.replace(/\babs\s*\(/g, 'Math.abs(');
    trimmed = trimmed.replace(/\bfabs\s*\(/g, 'Math.abs(');
    trimmed = trimmed.replace(/\bsin\s*\(/g, 'Math.sin(');
    trimmed = trimmed.replace(/\bcos\s*\(/g, 'Math.cos(');
    trimmed = trimmed.replace(/\btan\s*\(/g, 'Math.tan(');
    trimmed = trimmed.replace(/\bfloor\s*\(/g, 'Math.floor(');
    trimmed = trimmed.replace(/\bceil\s*\(/g, 'Math.ceil(');
    trimmed = trimmed.replace(/\bround\s*\(/g, 'Math.round(');
    trimmed = trimmed.replace(/\bexp\s*\(/g, 'Math.exp(');
    trimmed = trimmed.replace(/\blog\s*\(/g, 'Math.log(');
    trimmed = trimmed.replace(/\blog10\s*\(/g, 'Math.log10(');
    trimmed = trimmed.replace(/\brand\s*\(\s*\)/g, 'Math.floor(Math.random() * 32767)');

    // Handle array lookups: arr[i]
    trimmed = trimmed.replace(/([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]/g, (_, arrName, indexExpr) => {
      const idx = Number(this.evalExpr(indexExpr, vars, userFunctions)) || 0;
      if (Array.isArray(vars[arrName]) && vars[arrName][idx] !== undefined) {
        return String(vars[arrName][idx]);
      }
      return '0';
    });

    try {
      const sanitized = trimmed.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
        if (vars[match] !== undefined) {
          const v = vars[match];
          if (typeof v === 'string') return JSON.stringify(v);
          if (typeof v === 'boolean') return v ? 'true' : 'false';
          return String(v);
        }
        if (match === 'Math' || match === 'true' || match === 'false') return match;
        return match;
      });

      // Execute sanitized arithmetic/logic
      return Function(`"use strict"; return (${sanitized});`)();
    } catch {
      return 0;
    }
  }

  private evalCondition(cond: string, vars: Record<string, any>, userFunctions?: Record<string, UserFunction>): boolean {
    try {
      let sanitized = cond
        .replace(/getmaxx\s*\(\s*\)/g, '640')
        .replace(/getmaxy\s*\(\s*\)/g, '480');

      sanitized = sanitized.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
        if (vars[match] !== undefined) {
          const v = vars[match];
          if (typeof v === 'string') return JSON.stringify(v);
          return String(v);
        }
        if (match === 'Math' || match === 'true' || match === 'false') return match;
        return match;
      });
      return Boolean(Function(`"use strict"; return (${sanitized});`)());
    } catch {
      return false;
    }
  }

  private evalStep(step: string, vars: Record<string, any>, userFunctions?: Record<string, UserFunction>) {
    const trimmed = step.trim();
    if (trimmed.endsWith('++')) {
      const name = trimmed.replace('++', '').trim();
      if (vars[name] !== undefined) vars[name]++;
    } else if (trimmed.startsWith('++')) {
      const name = trimmed.replace('++', '').trim();
      if (vars[name] !== undefined) vars[name]++;
    } else if (trimmed.endsWith('--')) {
      const name = trimmed.replace('--', '').trim();
      if (vars[name] !== undefined) vars[name]--;
    } else if (trimmed.startsWith('--')) {
      const name = trimmed.replace('--', '').trim();
      if (vars[name] !== undefined) vars[name]--;
    } else if (trimmed.includes('+=')) {
      const parts = trimmed.split('+=');
      const name = parts[0].trim();
      const val = this.evalExpr(parts[1], vars, userFunctions);
      if (vars[name] !== undefined) vars[name] += val;
    } else if (trimmed.includes('-=')) {
      const parts = trimmed.split('-=');
      const name = parts[0].trim();
      const val = this.evalExpr(parts[1], vars, userFunctions);
      if (vars[name] !== undefined) vars[name] -= val;
    } else {
      const eq = trimmed.split('=');
      if (eq.length === 2) {
        vars[eq[0].trim()] = this.evalExpr(eq[1], vars, userFunctions);
      }
    }
  }

  private async callUserFunction(
    fn: UserFunction,
    argsStr: string,
    vars: Record<string, any>,
    userFunctions: Record<string, UserFunction>,
    onEvent: (event: ExecutionEvent) => void,
    requestInput?: () => Promise<string>,
    waitForKey?: () => Promise<string>
  ): Promise<any> {
    const localVars = { ...vars };
    const rawArgs = this.splitArgs(argsStr);
    for (let i = 0; i < fn.params.length; i++) {
      const param = fn.params[i];
      if (rawArgs[i] !== undefined) {
        localVars[param.name] = this.evalExpr(rawArgs[i], vars, userFunctions);
      }
    }

    const stmts = this.splitStatements(fn.body);
    for (const stmt of stmts) {
      if (this.isHalted) break;
      const res = await this.evalStatement(stmt, localVars, userFunctions, onEvent, requestInput, waitForKey);
      if (res !== undefined) return res;
    }
  }

  private handleGraphicsCommand(
    trimmed: string,
    vars: Record<string, any>,
    userFunctions: Record<string, UserFunction>,
    onEvent: (event: ExecutionEvent) => void
  ) {
    if (trimmed.includes('initgraph')) {
      onEvent({ kind: 'clear' });
      return;
    }

    const circleMatch = trimmed.match(/circle\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (circleMatch) {
      const x = Number(this.evalExpr(circleMatch[1], vars, userFunctions)) || 320;
      const y = Number(this.evalExpr(circleMatch[2], vars, userFunctions)) || 240;
      const r = Number(this.evalExpr(circleMatch[3], vars, userFunctions)) || 50;
      onEvent({ kind: 'draw_circle', x, y, r, color: vars['CURRENT_COLOR'] || 15 });
      return;
    }

    const lineMatch = trimmed.match(/line\s*\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (lineMatch) {
      const x = Number(this.evalExpr(lineMatch[1], vars, userFunctions)) || 0;
      const y = Number(this.evalExpr(lineMatch[2], vars, userFunctions)) || 0;
      const x2 = Number(this.evalExpr(lineMatch[3], vars, userFunctions)) || 100;
      const y2 = Number(this.evalExpr(lineMatch[4], vars, userFunctions)) || 100;
      onEvent({ kind: 'draw_line', x, y, x2, y2, color: vars['CURRENT_COLOR'] || 15 });
      return;
    }

    const rectMatch = trimmed.match(/rectangle\s*\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (rectMatch) {
      const x = Number(this.evalExpr(rectMatch[1], vars, userFunctions)) || 0;
      const y = Number(this.evalExpr(rectMatch[2], vars, userFunctions)) || 0;
      const x2 = Number(this.evalExpr(rectMatch[3], vars, userFunctions)) || 100;
      const y2 = Number(this.evalExpr(rectMatch[4], vars, userFunctions)) || 100;
      onEvent({ kind: 'draw_rect', x, y, x2, y2, color: vars['CURRENT_COLOR'] || 15 });
      return;
    }

    const barMatch = trimmed.match(/bar\s*\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (barMatch) {
      const x = Number(this.evalExpr(barMatch[1], vars, userFunctions)) || 0;
      const y = Number(this.evalExpr(barMatch[2], vars, userFunctions)) || 0;
      const x2 = Number(this.evalExpr(barMatch[3], vars, userFunctions)) || 100;
      const y2 = Number(this.evalExpr(barMatch[4], vars, userFunctions)) || 100;
      onEvent({ kind: 'draw_bar', x, y, x2, y2, color: vars['CURRENT_COLOR'] || 15 });
      return;
    }

    const scMatch = trimmed.match(/setcolor\s*\(([^)]+)\)/);
    if (scMatch) {
      vars['CURRENT_COLOR'] = Number(this.evalExpr(scMatch[1], vars, userFunctions)) || 15;
      onEvent({ kind: 'color', color: vars['CURRENT_COLOR'] });
      return;
    }

    const sbcMatch = trimmed.match(/setbkcolor\s*\(([^)]+)\)/);
    if (sbcMatch) {
      const bg = Number(this.evalExpr(sbcMatch[1], vars, userFunctions)) || 0;
      vars['CURRENT_BG'] = bg;
      onEvent({ kind: 'bg_color', bgColor: bg });
      return;
    }

    const otMatch = trimmed.match(/outtextxy\s*\(([^,]+),\s*([^,]+),\s*(.+)\)/);
    if (otMatch) {
      const x = Number(this.evalExpr(otMatch[1], vars, userFunctions)) || 0;
      const y = Number(this.evalExpr(otMatch[2], vars, userFunctions)) || 0;
      const textArg = otMatch[3].trim();
      let text = '';
      if (textArg.startsWith('"') && textArg.endsWith('"')) {
        text = textArg.slice(1, -1);
      } else if (vars[textArg] !== undefined) {
        text = String(vars[textArg]);
      } else {
        text = String(this.evalExpr(textArg, vars, userFunctions));
      }
      onEvent({ kind: 'draw_text', x, y, text, color: vars['CURRENT_COLOR'] || 15 });
      return;
    }
  }

  private splitStreamTokens(str: string): string[] {
    const tokens: string[] = [];
    let cur = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if ((c === '"' || c === "'") && str[i - 1] !== '\\') {
        if (!inQuote) {
          inQuote = true;
          quoteChar = c;
        } else if (c === quoteChar) {
          inQuote = false;
        }
      }

      if (!inQuote && c === '<' && str[i + 1] === '<') {
        if (cur.trim()) tokens.push(cur.trim());
        cur = '';
        i++; // skip second '<'
        continue;
      }
      cur += c;
    }

    if (cur.trim()) tokens.push(cur.trim().replace(/;$/, ''));
    return tokens;
  }

  private splitArgs(argsStr: string): string[] {
    const res: string[] = [];
    let cur = '';
    let inQuote = false;
    let depth = 0;
    for (let i = 0; i < argsStr.length; i++) {
      const c = argsStr[i];
      if ((c === '"' || c === "'") && argsStr[i - 1] !== '\\') inQuote = !inQuote;
      if (!inQuote) {
        if (c === '(' || c === '{' || c === '[') depth++;
        if (c === ')' || c === '}' || c === ']') depth--;
        if (c === ',' && depth === 0) {
          res.push(cur.trim());
          cur = '';
          continue;
        }
      }
      cur += c;
    }
    if (cur.trim()) res.push(cur.trim());
    return res;
  }

  private cleanFormatString(raw: string): string {
    return raw
      .replace(/^"|"$/g, '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\r/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '    ');
  }

  private applyFormatSpecifier(fmt: string, val: any): string {
    if (/%2d/.test(fmt)) return fmt.replace(/%2d/, String(val).padStart(2, ' '));
    if (/%\.2f/.test(fmt)) return fmt.replace(/%\.2f/, typeof val === 'number' ? val.toFixed(2) : String(val));
    if (/%[difs]/.test(fmt)) return fmt.replace(/%[difs]/, String(val));
    return fmt;
  }

  /**
   * Get variable type from its declaration or current value
   */
  private getVariableType(varName: string, vars: Record<string, any>): string {
    // Check if variable exists and infer type from current value
    if (vars[varName] !== undefined) {
      const val = vars[varName];
      if (typeof val === 'number') {
        // Could be int, float, double - default to int for integers
        return Number.isInteger(val) ? 'int' : 'float';
      }
      if (typeof val === 'string') {
        return val.length === 1 ? 'char' : 'string';
      }
    }
    
    // If variable not yet initialized, assume it needs numeric input by default
    // (most common case in C++ for uninitialized variables in cin)
    return 'int';
  }

  /**
   * Extract format specifier from scanf format string by index
   */
  private extractFormatSpecifier(format: string, index: number): string {
    const specs = format.match(/%[diouxXeEfFgGaAcspn]/g);
    return specs && specs[index] ? specs[index] : '';
  }
}

export const turboCompiler = new TurboCompiler();
