#!/bin/bash

# Exit on error
set -e

echo "Fixing all remaining issues..."

# 1. Fix SSL configuration
bash /var/www/flahacalc/scripts/server/fix-ssl.sh

# 2. Fix image paths and create missing images
bash /var/www/flahacalc/scripts/server/fix-images.sh

# 3. Fix Nginx root directory
bash /var/www/flahacalc/scripts/server/fix-nginx-root.sh

# 4. Restart services
echo "Restarting services..."
systemctl restart nginx
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server

echo "All issues fixed successfully!"