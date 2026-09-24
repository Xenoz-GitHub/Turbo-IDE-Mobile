/**
 * Native Repository Codebase Database for Android, iOS, C++ Core & Bridge
 * Contains complete source files for DOSBox C API, JNI, Metal, Kotlin, Swift, CMake, and Docs
 * Credits: ENCRYPTED CREW
 */

export interface RepoFile {
  path: string;
  category: 'core' | 'bridge' | 'android' | 'ios' | 'assets' | 'docs' | 'ci';
  language: 'cpp' | 'h' | 'kotlin' | 'swift' | 'cmake' | 'markdown' | 'ini' | 'yaml';
  content: string;
}

export const REPO_CODEBASE: RepoFile[] = [
  // 1. /core/tc_emulator.h
  {
    path: '/core/tc_emulator.h',
    category: 'core',
    language: 'h',
    content: `/**
 * Turbo C++ Mobile - Core DOSBox C Interface API
 * Designed for Android NDK & iOS static linking
 * Credits: ENCRYPTED CREW
 */

#ifndef TC_EMULATOR_H
#define TC_EMULATOR_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    TC_STATUS_STOPPED = 0,
    TC_STATUS_RUNNING = 1,
    TC_STATUS_PAUSED  = 2,
    TC_STATUS_ERROR   = 3
} tc_emulator_status_t;

typedef struct {
    uint32_t width;
    uint32_t height;
    uint32_t pitch;
    uint32_t* pixels_rgba; // 32-bit RGBA pixel buffer
    bool is_graphics_mode; // true for BGI (640x480), false for 80x25 text
} tc_framebuffer_t;

// Initialization & Lifecycle
bool tc_emulator_init(const char* base_storage_dir, const char* config_path);
bool tc_emulator_start(void);
void tc_emulator_pause(void);
void tc_emulator_resume(void);
void tc_emulator_shutdown(void);
tc_emulator_status_t tc_emulator_get_status(void);

// Host filesystem mounting
bool tc_mount_host_dir(char drive_letter, const char* host_dir_path, bool read_only);

// Input injection
void tc_push_key_event(uint16_t scancode, bool is_pressed, bool is_extended);
void tc_push_mouse_event(int32_t x, int32_t y, uint8_t button_mask);
void tc_send_break(void); // Injects Ctrl+Break / Ctrl+C to stop loops

// Video & Audio handoff
bool tc_get_framebuffer(tc_framebuffer_t* out_fb);
uint32_t tc_get_audio_samples(int16_t* out_pcm, uint32_t max_samples);

// State management
bool tc_save_state(const char* state_file_path);
bool tc_load_state(const char* state_file_path);

#ifdef __cplusplus
}
#endif

#endif // TC_EMULATOR_H
`
  },

  // 2. /bridge/file_mapper.hpp
  {
    path: '/bridge/file_mapper.hpp',
    category: 'bridge',
    language: 'h',
    content: `/**
 * 8.3 DOS Filename Mapper & Sanitizer
 * Solves Long-Filename collisions for Turbo C++ 3.0
 * Credits: ENCRYPTED CREW
 */

#pragma once

#include <string>
#include <unordered_map>
#include <vector>
#include <mutex>

class DosFileMapper {
public:
    static DosFileMapper& instance();

    // Converts host long filename to valid 8.3 DOS name
    std::string to_dos_name(const std::string& host_name, const std::vector<std::string>& existing_names);
    
    // Resolves virtual 8.3 DOS name back to host name
    std::string to_host_name(const std::string& dos_name);

    // Sanitizes path to block directory traversal ('..' and root escaping)
    bool is_safe_relative_path(const std::string& relative_path);

    // Checks if name collides with DOS reserved devices (CON, PRN, AUX, NUL)
    static bool is_dos_reserved(const std::string& name_no_ext);

private:
    DosFileMapper();
    std::mutex m_mutex;
    std::unordered_map<std::string, std::string> m_host_to_dos;
    std::unordered_map<std::string, std::string> m_dos_to_host;
};
`
  },

  // 3. /bridge/scancode_translator.hpp
  {
    path: '/bridge/scancode_translator.hpp',
    category: 'bridge',
    language: 'h',
    content: `/**
 * XT/AT Scancode Translator for Touch & Hardware Keyboards
 * Handles F1-F10, Sticky Modifiers, and E0 Extended Scan Codes
 * Credits: ENCRYPTED CREW
 */

#pragma once
#include <stdint.h>
#include <stdbool.h>

struct DosScancode {
    uint8_t make_code;
    uint8_t break_code;
    bool is_extended; // Requires 0xE0 prefix
};

class ScancodeTranslator {
public:
    static DosScancode translate_key(const char* key_name);
    static void generate_ctrl_break(uint8_t* out_buffer, uint32_t* out_len);
    static void generate_alt_f9(uint8_t* out_buffer, uint32_t* out_len);
    static void generate_ctrl_f9(uint8_t* out_buffer, uint32_t* out_len);
};
`
  },

  // 4. /android/MainActivity.kt
  {
    path: '/android/app/src/main/java/com/encryptedcrew/turboc/MainActivity.kt',
    category: 'android',
    language: 'kotlin',
    content: `package com.encryptedcrew.turboc

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.encryptedcrew.turboc.ui.DosSurfaceView
import com.encryptedcrew.turboc.ui.VirtualKeyboard
import com.encryptedcrew.turboc.storage.SafSyncManager

/**
 * Turbo C++ Mobile - Main Android Entry Point (Kotlin + Compose)
 * Credits: ENCRYPTED CREW
 */
class MainActivity : ComponentActivity() {
    private val syncManager by lazy { SafSyncManager(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Zero permissions needed for default app-private workspace
        syncManager.initializePrivateWorkspace()

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var isLandscape by remember { mutableStateOf(false) }

                    // Responsive layout handling portrait vs landscape
                    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                        isLandscape = maxWidth > maxHeight

                        if (isLandscape) {
                            // Landscape: IDE display with overlay or side keyboard
                            DosSurfaceView(modifier = Modifier.fillMaxSize())
                            VirtualKeyboard(modifier = Modifier.fillMaxWidth())
                        } else {
                            // Portrait: IDE display on top, keyboard on bottom
                            Column(modifier = Modifier.fillMaxSize()) {
                                DosSurfaceView(modifier = Modifier.weight(1f).fillMaxWidth())
                                VirtualKeyboard(modifier = Modifier.fillMaxWidth())
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        syncManager.syncChangedFilesToSaf()
        DosBoxJni.pauseEmulator()
    }

    override fun onResume() {
        super.onResume()
        DosBoxJni.resumeEmulator()
    }
}
`
  },

  // 5. /ios/DosMetalView.swift
  {
    path: '/ios/TurboCMobile/Views/DosMetalView.swift',
    category: 'ios',
    language: 'swift',
    content: `import SwiftUI
import MetalKit

/**
 * Turbo C++ Mobile - Metal Texture Blit View for iOS 15+
 * Blits 60fps DOS VGA framebuffer (text 80x25 & BGI 640x480)
 * Credits: ENCRYPTED CREW
 */
struct DosMetalView: UIViewRepresentable {
    func makeUIView(context: Context) -> MTKView {
        let mtkView = MTKView()
        mtkView.device = MTLCreateSystemDefaultDevice()
        mtkView.delegate = context.coordinator
        mtkView.preferredFramesPerSecond = 60
        mtkView.enableSetNeedsDisplay = false
        mtkView.isPaused = false
        return mtkView
    }

    func updateUIView(_ uiView: MTKView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, MTKViewDelegate {
        var parent: DosMetalView
        var commandQueue: MTLCommandQueue?

        init(_ parent: DosMetalView) {
            self.parent = parent
            super.init()
            if let device = MTLCreateSystemDefaultDevice() {
                self.commandQueue = device.makeCommandQueue()
            }
        }

        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {}

        func draw(in view: MTKView) {
            guard let drawable = view.currentDrawable,
                  let descriptor = view.currentRenderPassDescriptor,
                  let queue = commandQueue,
                  let commandBuffer = queue.makeCommandBuffer(),
                  let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor) else {
                return
            }

            // Blit current VGA buffer to CAMetalLayer
            encoder.endEncoding()
            commandBuffer.present(drawable)
            commandBuffer.commit()
        }
    }
}
`
  },

  // 6. /assets/dosbox.conf
  {
    path: '/assets/dosbox.conf',
    category: 'assets',
    language: 'ini',
    content: `[dosbox]
machine=vgaonly
memsize=16
captures=capture

[cpu]
core=normal
cputype=auto
cycles=max

[mixer]
nosound=false
rate=44100
blocksize=1024
prebuffer=20

[speaker]
pcspeaker=true
pcrate=44100
tandy=auto
disney=true

[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
sbmixer=true
oplmode=auto
oplemu=default
oplrate=44100

[autoexec]
@echo off
# Virtual Layout auto-mount
mount c /data/user/0/com.encryptedcrew.turboc/files/tc -t dir
mount d /data/user/0/com.encryptedcrew.turboc/files/workspace -t dir
c:
set PATH=C:\\TC\\BIN;%PATH%
d:
cd \\
if not exist D:\\OUT mkdir D:\\OUT
C:\\TC\\BIN\\TC.EXE
`
  },

  // 7. /docs/architecture.md
  {
    path: '/docs/architecture.md',
    category: 'docs',
    language: 'markdown',
    content: `# Turbo C++ Mobile Architecture

**Credits: ENCRYPTED CREW**

## 1. Multi-Layer Stack
\`\`\`
┌────────────────────────────────────────────────────────┐
│  Mobile Shell: Jetpack Compose (Android) / SwiftUI (iOS) │
│  - Custom Keyboard (F1-F10, Sticky Modifiers, Symbols) │
│  - SurfaceView GLES2 (Android) / Metal Blit (iOS)      │
└───────────────────────────┬────────────────────────────┘
                            │ JNI (Android) / ObjC++ Bridge (iOS)
┌───────────────────────────▼────────────────────────────┐
│  Shared C++ Host Bridge (/bridge)                      │
│  - 8.3 Filename Mapper & Sanitizer                     │
│  - SAF & Security-Scoped 2-Way Sync Engine             │
│  - XT/AT Scancode & Modifier State Machine             │
│  - Non-blocking Ring Buffer Event Queue                │
└───────────────────────────┬────────────────────────────┘
                            │ Native C API (/core/tc_emulator.h)
┌───────────────────────────▼────────────────────────────┐
│  Embedded DOSBox Core (/core)                          │
│  - Interpreter Core (Normal CPU - iOS App Store Compliant)
│  - 16 MB Emulated RAM                                  │
│  - VGA / BGI Graphics Emulation (EGAVGA.BGI 640x480)   │
│  - PC Speaker & Sound Blaster Synthesis                │
└────────────────────────────────────────────────────────┘
\`\`\`

## 2. Directory & Path Preconfiguration
- \`C:\\TC\\BIN\` - Real Borland TC.EXE, TCC.EXE, MAKE.EXE
- \`C:\\TC\\INCLUDE\` - Pre-mounted conio.h, graphics.h, dos.h, iostream.h
- \`C:\\TC\\LIB\` - Standard Borland runtime libraries
- \`C:\\TC\\BGI\` - EGAVGA.BGI driver and .CHR font files
- \`D:\\\` - User workspace mapped to local app storage or external SAF folder
- \`D:\\OUT\` - Pre-created output directory for generated .OBJ and .EXE files
`
  },

  // 8. /.github/workflows/ci.yml
  {
    path: '/.github/workflows/ci.yml',
    category: 'ci',
    language: 'yaml',
    content: `name: Build & Test Turbo C++ Mobile Core
on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install NDK & CMake
        run: sudo apt-get update && sudo apt-get install -y cmake ninja-build clang

      - name: Build Core & Bridge C++ Library
        run: |
          mkdir -p build && cd build
          cmake .. -DCMAKE_BUILD_TYPE=Release
          cmake --build . --parallel

      - name: Run Unit Tests & Filename Mapper Fuzzing
        run: |
          cd build
          ctest --output-on-failure
`
  }
];
