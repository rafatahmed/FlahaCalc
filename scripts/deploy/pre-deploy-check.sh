#!/bin/bash

# Exit on error
set -e

echo "Running pre-deployment checks..."

# Check for hardcoded localhost URLs (excluding the environment-aware code)
echo "Checking for hardcoded localhost URLs..."
grep -r "localhost:3000" --include="*.js" --include="*.html" --exclude="*live-weather.js" ./EVAPOTRAN || echo "No hardcoded localhost URLs found."

# Check if server.js exists
echo "Checking for server.js..."
if [ ! -f "./EVAPOTRAN/server/server.js" ]; then
  echo "ERROR: server.js not found in EVAPOTRAN/server directory."
  exit 1
fi

# Check if package.json exists in server directory
echo "Checking for server package.json..."
if [ ! -f "./EVAPOTRAN/server/package.json" ]; then
  echo "ERROR: package.json not found in EVAPOTRAN/server directory."
  exit 1
fi

# Check if .env file exists in server directory (for local testing)
echo "Checking for server .env file..."
if [ ! -f "./EVAPOTRAN/server/.env" ]; then
  echo "WARNING: .env file not found in EVAPOTRAN/server directory. Make sure to set up environment variables on the server."
fi

echo "All pre-deployment checks passed!"
