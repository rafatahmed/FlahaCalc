#!/bin/bash

# Exit on error
set -e

echo "Running pre-commit checks..."

# 1. Run linting
echo "Running linting..."
# Add your linting command here, e.g.:
# eslint EVAPOTRAN/js/*.js

# 2. Check for console.log statements
console_logs=$(grep -r "console.log" --include="*.js" EVAPOTRAN/js)
if [ ! -z "$console_logs" ]; then
  echo "Warning: console.log statements found:"
  echo "$console_logs"
  echo "Consider removing them before committing."
  # Uncomment to fail the commit if console.logs are found
  # exit 1
fi

# 3. Check for large files
large_files=$(find EVAPOTRAN -type f -size +1M | grep -v "node_modules" | grep -v ".git")
if [ ! -z "$large_files" ]; then
  echo "Warning: Large files found:"
  echo "$large_files"
  echo "Consider optimizing or excluding them."
fi

# 4. Check for sensitive information
sensitive_info=$(grep -r "API_KEY\|SECRET\|PASSWORD" --include="*.js" --include="*.html" --include="*.json" EVAPOTRAN)
if [ ! -z "$sensitive_info" ]; then
  echo "Warning: Potentially sensitive information found:"
  echo "$sensitive_info"
  echo "Consider removing or securing this information."
  # Uncomment to fail the commit if sensitive info is found
  # exit 1
fi

echo "Pre-commit checks completed!"