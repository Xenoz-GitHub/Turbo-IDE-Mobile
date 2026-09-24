/**
 * XT/AT Scancode Translator Header
 * Credits: ENCRYPTED CREW
 */

#ifndef TC_SCANCODE_TRANSLATOR_HPP
#define TC_SCANCODE_TRANSLATOR_HPP

#include <stdint.h>
#include <string>

struct DosScancode {
    uint8_t make_code;
    uint8_t break_code;
    bool is_extended;
};

class ScancodeTranslator {
public:
    static DosScancode translate_key(const std::string& key_name);
};

#endif // TC_SCANCODE_TRANSLATOR_HPP
