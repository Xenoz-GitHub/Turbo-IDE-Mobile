/**
 * 8.3 DOS Filename Mapper & Sanitizer Header
 * Credits: ENCRYPTED CREW
 */

#ifndef TC_FILE_MAPPER_HPP
#define TC_FILE_MAPPER_HPP

#include <string>
#include <unordered_map>
#include <vector>
#include <mutex>

class DosFileMapper {
public:
    static DosFileMapper& instance();

    std::string to_dos_name(const std::string& host_name, const std::vector<std::string>& existing_names);
    std::string to_host_name(const std::string& dos_name);
    bool is_safe_relative_path(const std::string& relative_path);
    static bool is_dos_reserved(const std::string& name_no_ext);

private:
    DosFileMapper();
    std::mutex m_mutex;
    std::unordered_map<std::string, std::string> m_host_to_dos;
    std::unordered_map<std::string, std::string> m_dos_to_host;
};

#endif // TC_FILE_MAPPER_HPP
