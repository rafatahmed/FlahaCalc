#!/bin/bash

# Check if server is responding
RESPONSE=$(curl -s http://localhost:3000/api/test)

if [[ "$RESPONSE" == *"status"*"ok"* ]]; then
  echo "Server is healthy: $(date)"
else
  echo "Server health check failed: $(date)"
  echo "Restarting server..."
  pm2 restart flahacalc-server
fi
