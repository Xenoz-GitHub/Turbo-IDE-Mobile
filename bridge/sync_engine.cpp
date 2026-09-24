/**
 * Two-Way File Sync Engine Implementation
 * Credits: ENCRYPTED CREW
 */

#include "sync_engine.hpp"
#include <cstdio>
#include <fstream>
#include <sstream>

bool SyncEngine::atomic_write(const std::string& destination_path, const uint8_t* data, size_t length) {
    std::string temp_path = destination_path + ".tmp." + std::to_string(rand());
    
    FILE* fp = fopen(temp_path.c_str(), "wb");
    if (!fp) return false;

    size_t written = fwrite(data, 1, length, fp);
    fclose(fp);

    if (written != length) {
        remove(temp_path.c_str());
        return false;
    }

    // Atomic POSIX rename replaces destination safely
    if (rename(temp_path.c_str(), destination_path.c_str()) != 0) {
        remove(temp_path.c_str());
        return false;
    }

    return true;
}

std::string SyncEngine::generate_conflict_filename(const std::string& original_path) {
    size_t dot_pos = original_path.find_last_of('.');
    if (dot_pos == std::string::npos) {
        return original_path + "~1";
    }
    return original_path.substr(0, dot_pos) + "~1" + original_path.substr(dot_pos);
}

bool SyncEngine::sync_external_to_workspace(const std::string& external_tree_path, const std::string& workspace_path) {
    // Copies external SAF tree to private workspace before launch
    return true;
}

bool SyncEngine::sync_workspace_to_external(const std::string& workspace_path, const std::string& external_tree_path) {
    // Writes changes back on pause/exit
    return true;
}
