/**
 * 8.3 DOS Filename Mapper & Sanitizer Implementation
 * Solves Long-Filename collisions for Turbo C++ 3.0
 * Credits: ENCRYPTED CREW
 */

#include "file_mapper.hpp"
#include <algorithm>
#include <cctype>
#include <set>

DosFileMapper& DosFileMapper::instance() {
    static DosFileMapper s_instance;
    return s_instance;
}

DosFileMapper::DosFileMapper() {
    // Standard Borland files
    m_host_to_dos["HELLO.CPP"] = "HELLO.CPP";
    m_dos_to_host["HELLO.CPP"] = "HELLO.CPP";
}

bool DosFileMapper::is_dos_reserved(const std::string& name_no_ext) {
    static const std::set<std::string> reserved = {
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    };
    std::string upper = name_no_ext;
    std::transform(upper.begin(), upper.end(), upper.begin(), ::toupper);
    return reserved.find(upper) != reserved.end();
}

bool DosFileMapper::is_safe_relative_path(const std::string& relative_path) {
    if (relative_path.empty()) return false;
    if (relative_path.find("..") != std::string::npos) return false;
    if (relative_path[0] == '/' || relative_path[0] == '\\') return false;
    return true;
}

std::string DosFileMapper::to_dos_name(const std::string& host_name, const std::vector<std::string>& existing_names) {
    std::lock_guard<std::mutex> lock(m_mutex);

    auto it = m_host_to_dos.find(host_name);
    if (it != m_host_to_dos.end()) {
        return it->second;
    }

    size_t dot_pos = host_name.find_last_of('.');
    std::string base = (dot_pos != std::string::npos) ? host_name.substr(0, dot_pos) : host_name;
    std::string ext = (dot_pos != std::string::npos) ? host_name.substr(dot_pos + 1) : "";

    // Sanitize to uppercase alphanumeric
    std::string clean_base;
    for (char c : base) {
        if (std::isalnum(c) || c == '_' || c == '$' || c == '-') {
            clean_base += static_cast<char>(std::toupper(c));
        } else {
            clean_base += '_';
        }
    }
    if (clean_base.empty()) clean_base = "FILE";

    std::string clean_ext;
    for (char c : ext) {
        if (std::isalnum(c)) clean_ext += static_cast<char>(std::toupper(c));
    }
    if (clean_ext.size() > 3) clean_ext = clean_ext.substr(0, 3);

    if (is_dos_reserved(clean_base)) {
        clean_base = "X_" + clean_base.substr(0, 6);
    }

    std::set<std::string> existing_set;
    for (const auto& name : existing_names) {
        std::string upper = name;
        std::transform(upper.begin(), upper.end(), upper.begin(), ::toupper);
        existing_set.insert(upper);
    }

    std::string candidate_base = clean_base.substr(0, 8);
    std::string candidate_dos = clean_ext.empty() ? candidate_base : (candidate_base + "." + clean_ext);
    int collision_index = 1;

    while (existing_set.find(candidate_dos) != existing_set.end()) {
        std::string suffix = "~" + std::to_string(collision_index);
        size_t allowed_len = (suffix.size() < 8) ? (8 - suffix.size()) : 1;
        candidate_base = clean_base.substr(0, allowed_len) + suffix;
        candidate_dos = clean_ext.empty() ? candidate_base : (candidate_base + "." + clean_ext);
        collision_index++;
    }

    m_host_to_dos[host_name] = candidate_dos;
    m_dos_to_host[candidate_dos] = host_name;

    return candidate_dos;
}

std::string DosFileMapper::to_host_name(const std::string& dos_name) {
    std::lock_guard<std::mutex> lock(m_mutex);
    std::string upper = dos_name;
    std::transform(upper.begin(), upper.end(), upper.begin(), ::toupper);

    auto it = m_dos_to_host.find(upper);
    if (it != m_dos_to_host.end()) {
        return it->second;
    }
    return dos_name;
}
