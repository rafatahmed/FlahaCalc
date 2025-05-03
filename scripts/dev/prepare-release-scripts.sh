#!/bin/bash

# Exit on error
set -e

echo "Preparing release scripts..."

# Make release scripts executable
chmod +x scripts/release/create-release.sh
chmod +x scripts/release/generate-release-notes.sh

echo "Release scripts are now executable."
echo "You can now run:"
echo "  npm run release:notes <version>"
echo "  npm run release:create <version>"
echo ""
echo "Example: npm run release:notes 0.2.0"