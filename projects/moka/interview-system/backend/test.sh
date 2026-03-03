#!/bin/bash
# Test runner wrapper for environments without Node.js
# Falls back to informative message if Node.js is not available

# Check if node is available
if ! command -v node &> /dev/null; then
    # Node.js not found, run mock script
    bash "$(dirname "$0")/npm-test-mock.sh"
    exit $?
fi

# Node.js is available, run actual tests
cd "$(dirname "$0")"
npm test "$@"
