/**
 * Borland Turbo C++ 3.0 Syntax Tokenizer & Highlighter Engine
 * Implements lightweight tokenization for C/C++ keywords, preprocessor, strings,
 * comments (single & multi-line), numbers, BGI/conio functions, and operators.
 * Palette: Authentic 16-color Borland EGA/VGA palette on #0000AA deep blue background.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

export interface HighlightToken {
  type:
    | 'keyword'
    | 'preprocessor'
    | 'string'
    | 'number'
    | 'comment'
    | 'library'
    | 'identifier'
    | 'operator'
    | 'whitespace';
  text: string;
  color: string;
}

// Borland C++ 3.0 Keywords
const KEYWORDS = new Set([
  'void', 'main', 'int', 'float', 'double', 'char', 'long', 'short', 'signed', 'unsigned',
  'for', 'while', 'do', 'if', 'else', 'return', 'switch', 'case', 'default', 'break', 'continue',
  'class', 'struct', 'union', 'enum', 'public', 'private', 'protected', 'virtual', 'friend',
  'const', 'static', 'sizeof', 'typedef', 'inline', 'extern', 'register', 'volatile', 'goto',
  'new', 'delete', 'this', 'operator', 'template', 'cout', 'cin', 'endl', 'cerr', 'clog',
  'asm', 'pascal', 'cdecl', 'near', 'far', 'huge', 'interrupt'
]);

// Classic Borland C/C++ Runtime & BGI Library Functions
const LIBRARY_FUNCTIONS = new Set([
  'printf', 'scanf', 'cprintf', 'cscanf', 'sprintf', 'sscanf', 'puts', 'gets',
  'clrscr', 'gotoxy', 'getch', 'getche', 'kbhit', 'wherex', 'wherey',
  'textcolor', 'textbackground', 'lowvideo', 'highvideo', 'normvideo',
  'sound', 'nosound', 'delay', 'sleep',
  'initgraph', 'closegraph', 'cleardevice', 'setcolor', 'setbkcolor',
  'circle', 'line', 'rectangle', 'bar', 'bar3d', 'arc', 'ellipse', 'fillellipse',
  'outtext', 'outtextxy', 'getmaxx', 'getmaxy', 'textwidth', 'textheight',
  'settextstyle', 'setfillstyle', 'floodfill', 'getpixel', 'putpixel',
  'exit', 'abort', 'system', 'malloc', 'free', 'calloc', 'realloc',
  'abs', 'sqrt', 'pow', 'sin', 'cos', 'tan', 'rand', 'srand'
]);

// Borland Constants and Macros
const CONSTANTS = new Set([
  'DETECT', 'NULL', 'EOF', 'TRUE', 'FALSE', 'true', 'false',
  'BLACK', 'BLUE', 'GREEN', 'CYAN', 'RED', 'MAGENTA', 'BROWN', 'LIGHTGRAY',
  'DARKGRAY', 'LIGHTBLUE', 'LIGHTGREEN', 'LIGHTCYAN', 'LIGHTRED', 'LIGHTMAGENTA', 'YELLOW', 'WHITE',
  'SOLID_FILL', 'EMPTY_FILL', 'LINE_SOLID', 'DEFAULT_FONT'
]);

/**
 * Tokenize C/C++ code into styled tokens for the Turbo C++ 3.0 IDE.
 */
export function tokenizeCpp(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    const char = code[i];

    // 1. Whitespace (spaces, tabs, newlines)
    if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
      let ws = '';
      while (i < len && (code[i] === ' ' || code[i] === '\t' || code[i] === '\r' || code[i] === '\n')) {
        ws += code[i++];
      }
      tokens.push({ type: 'whitespace', text: ws, color: 'inherit' });
      continue;
    }

    // 2. Single-line comment: //
    if (char === '/' && code[i + 1] === '/') {
      let comment = '';
      while (i < len && code[i] !== '\n') {
        comment += code[i++];
      }
      tokens.push({
        type: 'comment',
        text: comment,
        color: '#AAAAAA' // Borland Silver/Gray for comments
      });
      continue;
    }

    // 3. Multi-line comment: /* ... */
    if (char === '/' && code[i + 1] === '*') {
      let comment = '/*';
      i += 2;
      while (i < len && !(code[i] === '*' && code[i + 1] === '/')) {
        comment += code[i++];
      }
      if (i < len) {
        comment += '*/';
        i += 2;
      }
      tokens.push({
        type: 'comment',
        text: comment,
        color: '#AAAAAA' // Borland Silver/Gray
      });
      continue;
    }

    // 4. Preprocessor directives: #include, #define, #ifdef, etc.
    if (char === '#') {
      let prep = '';
      while (i < len && code[i] !== '\n') {
        prep += code[i++];
      }
      tokens.push({
        type: 'preprocessor',
        text: prep,
        color: '#55FFFF' // EGA Light Cyan for Preprocessor (#include...)
      });
      continue;
    }

    // 5. String Literals: "..." (EGA Light Red in Borland C++ 3.0)
    if (char === '"') {
      let str = '"';
      i++;
      while (i < len && code[i] !== '"') {
        if (code[i] === '\\' && i + 1 < len) {
          str += code[i++];
        }
        str += code[i++];
      }
      if (i < len && code[i] === '"') {
        str += code[i++];
      }
      tokens.push({
        type: 'string',
        text: str,
        color: '#FF5555' // EGA Light Red for Strings (as seen in Image 4 & 7)
      });
      continue;
    }

    // 6. Character Literals: '...'
    if (char === "'") {
      let ch = "'";
      i++;
      while (i < len && code[i] !== "'") {
        if (code[i] === '\\' && i + 1 < len) {
          ch += code[i++];
        }
        ch += code[i++];
      }
      if (i < len && code[i] === "'") {
        ch += code[i++];
      }
      tokens.push({
        type: 'string',
        text: ch,
        color: '#FF5555' // EGA Light Red
      });
      continue;
    }

    // 7. Numbers (decimal, float, hex 0x...)
    if (/\d/.test(char) || (char === '.' && i + 1 < len && /\d/.test(code[i + 1]))) {
      let num = '';
      while (i < len && /[\d.xXa-fA-F_]/.test(code[i])) {
        num += code[i++];
      }
      tokens.push({
        type: 'number',
        text: num,
        color: '#55FFFF' // EGA Light Cyan for Numbers (e.g. 17, 60.0 in Image 7)
      });
      continue;
    }

    // 8. Identifiers, Keywords, Library Functions, Constants
    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_]/.test(code[i])) {
        word += code[i++];
      }

      if (KEYWORDS.has(word)) {
        tokens.push({
          type: 'keyword',
          text: word,
          color: '#FFFFFF' // Bright White (Borland bold/intense for void, main, float, int, if, else)
        });
      } else if (LIBRARY_FUNCTIONS.has(word)) {
        tokens.push({
          type: 'library',
          text: word,
          color: '#55FF55' // EGA Light Green for library functions (clrscr, getch, circle...)
        });
      } else if (CONSTANTS.has(word)) {
        tokens.push({
          type: 'number',
          text: word,
          color: '#FFFF55' // EGA Bright Yellow for constants
        });
      } else {
        tokens.push({
          type: 'identifier',
          text: word,
          color: '#55FF55' // EGA Light Green for identifiers/variables (salary, bonus, grade)
        });
      }
      continue;
    }

    // 9. Operators and Punctuation: ;, {, }, (, ), +, -, *, /, <, >, =, etc.
    tokens.push({
      type: 'operator',
      text: char,
      color: '#FFFFFF' // Crisp White for punctuation & operators
    });
    i++;
  }

  return tokens;
}
