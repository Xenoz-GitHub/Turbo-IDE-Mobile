/**
 * XT/AT Scancode Translator Implementation
 * Maps standard keys, F1-F10, and E0 extended prefixes for DOS Turbo C++
 * Credits: ENCRYPTED CREW
 */

#include "scancode_translator.hpp"

DosScancode ScancodeTranslator::translate_key(const std::string& key_name) {
    DosScancode sc = { 0, 0, false };

    // Function keys (F1-F10)
    if (key_name == "F1") { sc.make_code = 0x3B; }
    else if (key_name == "F2") { sc.make_code = 0x3C; }
    else if (key_name == "F3") { sc.make_code = 0x3D; }
    else if (key_name == "F4") { sc.make_code = 0x3E; }
    else if (key_name == "F5") { sc.make_code = 0x3F; }
    else if (key_name == "F6") { sc.make_code = 0x40; }
    else if (key_name == "F7") { sc.make_code = 0x41; }
    else if (key_name == "F8") { sc.make_code = 0x42; }
    else if (key_name == "F9") { sc.make_code = 0x43; }
    else if (key_name == "F10") { sc.make_code = 0x44; }

    // Navigation & Editing (Extended E0 scancodes)
    else if (key_name == "ArrowUp") { sc.make_code = 0x48; sc.is_extended = true; }
    else if (key_name == "ArrowDown") { sc.make_code = 0x50; sc.is_extended = true; }
    else if (key_name == "ArrowLeft") { sc.make_code = 0x4B; sc.is_extended = true; }
    else if (key_name == "ArrowRight") { sc.make_code = 0x4D; sc.is_extended = true; }
    else if (key_name == "Home") { sc.make_code = 0x47; sc.is_extended = true; }
    else if (key_name == "End") { sc.make_code = 0x4F; sc.is_extended = true; }
    else if (key_name == "PageUp") { sc.make_code = 0x49; sc.is_extended = true; }
    else if (key_name == "PageDown") { sc.make_code = 0x51; sc.is_extended = true; }
    else if (key_name == "Insert") { sc.make_code = 0x52; sc.is_extended = true; }
    else if (key_name == "Delete") { sc.make_code = 0x53; sc.is_extended = true; }

    // Standard Controls
    else if (key_name == "Escape") { sc.make_code = 0x01; }
    else if (key_name == "Tab") { sc.make_code = 0x0F; }
    else if (key_name == "Enter") { sc.make_code = 0x1C; }
    else if (key_name == "Backspace") { sc.make_code = 0x0E; }
    else if (key_name == " ") { sc.make_code = 0x39; }

    // Modifiers
    else if (key_name == "Shift") { sc.make_code = 0x2A; }
    else if (key_name == "Ctrl") { sc.make_code = 0x1D; }
    else if (key_name == "Alt") { sc.make_code = 0x38; }

    sc.break_code = sc.make_code | 0x80;
    return sc;
}
