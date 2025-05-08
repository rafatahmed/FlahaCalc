#!/bin/bash

# Exit on error
set -e

echo "Starting local development server..."

# Set up local development links
bash scripts/dev/setup-local-links.sh

# Check if http-server is installed
if ! command -v http-server &> /dev/null; then
    echo "http-server not found. Installing..."
    npm install -g http-server
fi

# Start the server from the public directory
echo "Starting server at http://localhost:8080"
echo "Access the site at:"
echo "  - Main site: http://localhost:8080/"
echo "  - PA division: http://localhost:8080/pa/"
echo "  - EVAPOTRAN: http://localhost:8080/pa/evapotran/"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the server from the public directory
cd public
http-server -p 8080 -c-1 ./




