#!/usr/bin/env bash
# Build Core & Bridge Libraries for Android ABIs and iOS
# Credits: ENCRYPTED CREW

set -e

echo "=== Building Turbo C++ Mobile Core Libraries ==="
echo "Credits: ENCRYPTED CREW"

BUILD_DIR="build_native"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

cmake ../core -DCMAKE_BUILD_TYPE=Release
cmake --build . --parallel

echo "=== Core Native Build Succeeded! ==="
