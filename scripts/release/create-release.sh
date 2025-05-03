#!/bin/bash

# Exit on error
set -e

# Check if version is provided
if [ -z "$1" ]; then
  echo "Error: Version number is required"
  echo "Usage: bash scripts/release/create-release.sh <version>"
  echo "Example: bash scripts/release/create-release.sh 0.2.0"
  exit 1
fi

VERSION=$1
TAG_NAME="v$VERSION"

echo "Creating release $TAG_NAME..."

# Update version in files
echo "Updating version in files..."

# Update VERSION file
echo "$VERSION" > VERSION

# Update package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

# Update README.md if it contains version info
if grep -q "version" README.md; then
  sed -i "s/version [0-9]\+\.[0-9]\+\.[0-9]\+/version $VERSION/" README.md
fi

# Commit version changes
echo "Committing version changes..."
git add VERSION package.json README.md
git commit -m "Prepare $VERSION release"

# Create annotated tag
echo "Creating annotated tag $TAG_NAME..."
git tag -a "$TAG_NAME" -m "EVAPOTRAN $VERSION release"

# Push changes and tag
echo "Pushing changes and tag to remote repository..."
git push origin main
git push origin "$TAG_NAME"

echo "Release $TAG_NAME created and pushed successfully!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub release at: https://github.com/rafatahmed/FlahaCalc/releases/new?tag=$TAG_NAME"
echo "2. Add release notes from RELEASE_NOTES.md"
echo "3. Publish the release"