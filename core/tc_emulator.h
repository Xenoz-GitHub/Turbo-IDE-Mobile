/**
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
