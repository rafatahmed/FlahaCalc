#!/bin/bash
# Check if version is provided
if [ -z "$1" ]; then
  echo "Error: Version number is required"
  echo "Usage: bash scripts/release/create-release.sh <version>"
  exit 1
fi

VERSION=$1
TAG_NAME="v$VERSION"

# Update version in files
echo "$VERSION" > VERSION
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
# Update README.md if it contains version info

# Commit version changes
git add VERSION package.json README.md
git commit -m "Prepare $VERSION release"

# Create annotated tag
git tag -a "$TAG_NAME" -m "EVAPOTRAN $VERSION release"

# Push changes and tag
git push origin main
git push origin "$TAG_NAME"
