#!/bin/bash
# Check if version is provided
if [ -z "$1" ]; then
  echo "Error: Version number is required"
  echo "Usage: bash scripts/release/generate-release-notes.sh <version>"
  exit 1
fi

VERSION=$1
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
RELEASE_DATE=$(date +"%Y-%m-%d")

# Create release notes file with template
cat > RELEASE_NOTES.md << EOF
# EVAPOTRAN $VERSION Release Notes
## Release Date: $VERSION ($RELEASE_DATE)
## Overview
...
EOF

echo "Release notes template generated in RELEASE_NOTES.md"
echo "Please edit the file to add detailed information about the release."
