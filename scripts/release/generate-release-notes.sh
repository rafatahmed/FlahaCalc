#!/bin/bash

# Exit on error
set -e

# Check if version is provided
if [ -z "$1" ]; then
  echo "Error: Version number is required"
  echo "Usage: bash scripts/release/generate-release-notes.sh <version>"
  echo "Example: bash scripts/release/generate-release-notes.sh 0.2.0"
  exit 1
fi

VERSION=$1
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
RELEASE_DATE=$(date +"%Y-%m-%d")

echo "Generating release notes for version $VERSION..."

# Create release notes file
cat > RELEASE_NOTES.md << EOF
# EVAPOTRAN $VERSION Release Notes

## Release Date: $VERSION ($RELEASE_DATE)

## Overview

This release of EVAPOTRAN includes [brief description of major changes].

## What's New

EOF

# If we have a previous tag, get the commit log
if [ ! -z "$PREV_TAG" ]; then
  echo "Fetching changes since $PREV_TAG..."
  
  # Add commit log to release notes
  echo "### Changes since $PREV_TAG" >> RELEASE_NOTES.md
  git log --pretty=format:"- %s" $PREV_TAG..HEAD >> RELEASE_NOTES.md
  echo "" >> RELEASE_NOTES.md
  echo "" >> RELEASE_NOTES.md
fi

# Add sections for manual editing
cat >> RELEASE_NOTES.md << EOF
## Key Features

- [Feature 1]
- [Feature 2]
- [Feature 3]

## Bug Fixes

- [Bug fix 1]
- [Bug fix 2]

## Performance Improvements

- [Performance improvement 1]
- [Performance improvement 2]

## Installation Instructions

1. [Installation step 1]
2. [Installation step 2]
3. [Installation step 3]

## Known Issues

- [Known issue 1]
- [Known issue 2]

## Feedback and Contributions

We welcome feedback and contributions to improve EVAPOTRAN:

- Report issues on our GitHub repository
- Submit feature requests through the issue tracker
- Contact us at info@flaha.org with questions or suggestions

## License

EVAPOTRAN is licensed under the GNU General Public License v3.0.
EOF

echo "Release notes template generated in RELEASE_NOTES.md"
echo "Please edit the file to add detailed information about the release."