#!/bin/bash

# Exit on error
set -e

echo "Running pre-deployment checks..."

# 1. Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js is installed (version: $NODE_VERSION)"
fi

# 2. Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm is installed (version: $NPM_VERSION)"
fi

# 3. Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ git is not installed"
    exit 1
else
    GIT_VERSION=$(git --version)
    echo "✅ git is installed ($GIT_VERSION)"
fi

# 4. Check if rsync is installed
if ! command -v rsync &> /dev/null; then
    echo "❌ rsync is not installed"
    exit 1
else
    RSYNC_VERSION=$(rsync --version | head -n 1)
    echo "✅ rsync is installed ($RSYNC_VERSION)"
fi

# 5. Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
else
    echo "✅ package.json exists"
fi

# 6. Check if EVAPOTRAN/server/server.js exists
if [ ! -f "EVAPOTRAN/server/server.js" ]; then
    echo "❌ EVAPOTRAN/server/server.js not found"
    exit 1
else
    echo "✅ EVAPOTRAN/server/server.js exists"
fi

# 7. Check if EVAPOTRAN/server/package.json exists
if [ ! -f "EVAPOTRAN/server/package.json" ]; then
    echo "❌ EVAPOTRAN/server/package.json not found"
    exit 1
else
    echo "✅ EVAPOTRAN/server/package.json exists"
fi

# 8. Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️ There are uncommitted changes"
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ No uncommitted changes"
fi

echo "All pre-deployment checks passed!"


