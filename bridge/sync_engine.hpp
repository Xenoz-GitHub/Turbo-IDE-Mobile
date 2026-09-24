/**
 * Two-Way File Sync Engine Header
 * Handles atomic writes, mtime/hash detection, and conflict file creation (NAME~1.CPP)
 * Credits: ENCRYPTED CREW
 */

#ifndef TC_SYNC_ENGINE_HPP
#define TC_SYNC_ENGINE_HPP

#include <string>
#include <vector>

struct SyncFileInfo {
    std::string path;
    uint64_t mtime;
    uint32_t size_bytes;
    std::string sha256_hash;
};

class SyncEngine {
public:
    static bool sync_external_to_workspace(const std::string& external_tree_path, const std::string& workspace_path);
    static bool sync_workspace_to_external(const std::string& workspace_path, const std::string& external_tree_path);
    static bool atomic_write(const std::string& destination_path, const uint8_t* data, size_t length);
    static std::string generate_conflict_filename(const std::string& original_path);
};

#endif // TC_SYNC_ENGINE_HPP
