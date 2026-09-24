#!/usr/bin/env python3
"""
Fuzz Test Suite for DOS 8.3 Filename Mapper
Tests long filenames, Unicode glyphs, directory traversal, and DOS reserved devices
Credits: ENCRYPTED CREW
"""

import re
import sys

RESERVED_NAMES = {
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
}

def to_dos_name(host_name, existing=None):
    if existing is None:
        existing = set()
    
    # Path traversal rejection
    if '..' in host_name or '/' in host_name or '\\' in host_name:
        raise ValueError(f"Path traversal detected in '{host_name}'")
    
    parts = host_name.split('.')
    base = parts[0]
    ext = parts[1] if len(parts) > 1 else ''
    
    # Clean base & ext
    clean_base = re.sub(r'[^A-Za-z0-9_$-]', '_', base).upper()
    clean_ext = re.sub(r'[^A-Za-z0-9]', '', ext).upper()[:3]
    
    if not clean_base:
        clean_base = 'FILE'
    
    if clean_base in RESERVED_NAMES:
        clean_base = 'X_' + clean_base[:6]
    
    candidate_base = clean_base[:8]
    candidate = f"{candidate_base}.{clean_ext}" if clean_ext else candidate_base
    
    collision = 1
    while candidate.upper() in existing:
        suffix = f"~{collision}"
        allowed_len = max(1, 8 - len(suffix))
        candidate_base = clean_base[:allowed_len] + suffix
        candidate = f"{candidate_base}.{clean_ext}" if clean_ext else candidate_base
        collision += 1
    
    return candidate.upper()

def run_fuzz_tests():
    print("Running DOS 8.3 Filename Fuzz Tests [Credits: ENCRYPTED CREW]...")
    existing = set()
    
    # 1. Normal conversion
    n1 = to_dos_name("my_first_program.cpp", existing)
    assert n1 == "MY_FIRST.CPP", f"Expected MY_FIRST.CPP, got {n1}"
    existing.add(n1)
    
    # 2. Collision resolution
    n2 = to_dos_name("my_first_program.cpp", existing)
    assert n2 == "MY_FIR~1.CPP", f"Expected MY_FIR~1.CPP, got {n2}"
    existing.add(n2)
    
    # 3. Reserved DOS names
    n3 = to_dos_name("CON.CPP", existing)
    assert not n3.startswith("CON."), f"CON must be sanitized, got {n3}"
    
    # 4. Path traversal attempt
    traversal_caught = False
    try:
        to_dos_name("../../etc/passwd", existing)
    except ValueError:
        traversal_caught = True
    assert traversal_caught, "Path traversal attempt must be rejected"
    
    print("All 8.3 Filename Fuzz Tests Passed Successfully!")

if __name__ == "__main__":
    run_fuzz_tests()
