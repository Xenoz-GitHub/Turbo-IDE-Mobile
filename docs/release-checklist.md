# Pre-Flight Store Release Checklist

**Credits: ENCRYPTED CREW**

---

## 1. Google Play Console Readiness
- [x] Target SDK set to latest stable (API 34).
- [x] Zero network permissions (\`android.permission.INTERNET\` omitted).
- [x] No broad storage permissions (\`MANAGE_EXTERNAL_STORAGE\` omitted). Storage Access Framework (\`ACTION_OPEN_DOCUMENT_TREE\`) used exclusively.
- [x] Play Data Safety form completed: "No user data collected or shared".
- [x] Adaptive launcher icon generated for all densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).
- [x] 64-bit compliance verified (\`arm64-v8a\` and \`x86_64\` native libraries present).

---

## 2. Apple App Store Review Guidelines Compliance
- [x] **Guideline 4.7 (Emulators):** Sandboxed retro computer emulator. Does not download executable code from external networks.
- [x] **No JIT Policy:** Normal CPU interpreter compiled in; dynamic core strictly disabled.
- [x] Files app integration enabled (\`UIFileSharingEnabled\` and \`LSSupportsOpeningDocumentsInPlace\` set to \`YES\`).
- [x] Security-scoped bookmarks lifecycle verified (\`startAccessingSecurityScopedResource\` matched with \`stopAccessingSecurityScopedResource\`).
- [x] Accessibility: Minimum 44pt touch targets on all native UI buttons. VoiceOver labels provided for all navigation controls.
