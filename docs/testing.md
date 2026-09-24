# Testing & Acceptance Manual Checklist

**Credits: ENCRYPTED CREW**

---

## 1. Automated Acceptance Criteria (Section 14)
- [x] **TC-01: Zero-Config Install:** Turbo C++ boots directly into TC.EXE without manual MOUNT commands.
- [x] **TC-02: Hello World Regression:** Compiles `#include<iostream.h> #include<conio.h> void main(){clrscr(); cout<<"HELLO WORLD"; getch();}` with 0 errors. Fixes "Unable to open include file" and "Unable to create output file".
- [x] **TC-03: BGI Graphics:** `initgraph(&gd,&gm,"C:\\TC\\BGI")` draws circles/lines and enters 640x480 EGA/VGA mode.
- [x] **TC-04: Audio Synthesis:** `sound(freq)`, `delay(ms)`, `nosound()` generate square-wave PC speaker tones.
- [x] **TC-05: 8.3 Filename Mapping:** Maps long names (`student_code.cpp` -> `STUDENT_.CPP`), resolves collisions (`STUDEN~1.CPP`), and sanitizes reserved names (`CON`, `PRN`, `AUX`, `NUL`).
- [x] **TC-06: CRLF Line Endings:** Byte-for-byte preservation without corruption.
- [x] **TC-07: Orientation Support:** Seamless switching between portrait editor and landscape coding.
- [x] **TC-08: Break & Watchdog:** Interrupt button stops infinite while(1) loops safely.

---

## 2. Hardware Testing Devices
- **Android:**
  - Low-End: Redmi 9A (arm64-v8a, 2GB RAM, Android 10)
  - Mid-Range: Pixel 6a (Tensor, 6GB RAM, Android 13/14)
  - Tablet: Galaxy Tab S8 (Snapdragon 8 Gen 1, Android 13)
- **iOS:**
  - Phone: iPhone 11 / iPhone 13 (A13 / A15 Bionic, iOS 16/17)
  - Tablet: iPad 9th Gen / iPad Air (A13 / M1, iPadOS 17)
