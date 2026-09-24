# Turbo C++ Mobile Architecture

**Credits: ENCRYPTED CREW**
**Target Platforms: Android (API 26+) & iOS (15+)**

---

## 1. System Layers
1. **Host Shell (UI Layer):**
   - **Android:** Kotlin + Jetpack Compose shell. Renders the 60fps DOS framebuffer using GLES2 texture blit in \`DosSurfaceView\`.
   - **iOS:** Swift + SwiftUI shell. Renders the 60fps DOS framebuffer via Metal (\`CAMetalLayer\`) in \`DosMetalView\`.
   - Handles portrait and landscape orientations, dynamic viewport zoom/pan, and custom on-screen keyboard.

2. **Host Bridge (C++):**
   - \`file_mapper.hpp/.cpp\`: Bidirectional 8.3 filename mapping, path traversal validation, and collision resolution.
   - \`sync_engine.hpp/.cpp\`: Storage Access Framework (Android) and Security-Scoped Bookmarks (iOS) two-way sync engine.
   - \`scancode_translator.hpp/.cpp\`: Translates touch and hardware keystrokes into XT/AT make/break scancodes.

3. **Emulator Core (C API):**
   - Embedded DOSBox interpreter engine (\`core=normal\`).
   - Normal core interpreter selected for strict iOS App Store compliance (JIT is prohibited).
   - 16MB RAM, VGA 640x480, Sound Blaster 16 & PC Speaker synthesis.

---

## 2. DOS Layout & Directory Preconfiguration
- \`C:\`: Mounted to app-private Turbo C++ system directory:
  - \`C:\TC\BIN\TC.EXE\`, \`TCC.EXE\`, \`MAKE.EXE\`
  - \`C:\TC\INCLUDE\` (pre-baked conio.h, graphics.h, dos.h, iostream.h)
  - \`C:\TC\LIB\`
  - \`C:\TC\BGI\` (\`EGAVGA.BGI\`, \`CGA.BGI\`, \`TRIP.CHR\`)
- \`D:\`: Mounted to user workspace.
  - \`D:\OUT\`: Auto-created output directory for generated executables.
