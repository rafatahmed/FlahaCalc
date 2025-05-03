#!/bin/bash

# Exit on error
set -e

echo "Restarting the server..."
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server

echo "Server restarted successfully."