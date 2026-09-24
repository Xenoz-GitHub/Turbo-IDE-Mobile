cmake_minimum_required(VERSION 3.22.1)
project(TurboCEmulatorCore VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Compile options for mobile performance & strict warnings
add_compile_options(-Wall -Wextra -O3 -fPIC)

# On iOS: Disable JIT completely to comply with App Store rules
if(APPLE AND IOS)
    add_compile_definitions(DOSBOX_CORE_NORMAL_ONLY=1)
    add_compile_definitions(DISABLE_DYNAMIC_CORE=1)
endif()

# Core static library
add_library(tc_core STATIC
    tc_emulator.cpp
    tc_emulator.h
)

target_include_directories(tc_core PUBLIC
    \${CMAKE_CURRENT_SOURCE_DIR}
)
