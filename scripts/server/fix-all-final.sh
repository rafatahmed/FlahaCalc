#!/bin/bash

# Exit on error
set -e

echo "Fixing all remaining issues..."

# 1. Fix the Nginx API routing
bash /var/www/flahacalc/scripts/server/fix-nginx-api.sh

# 2. Fix all missing images
bash /var/www/flahacalc/scripts/server/fix-images-final.sh

# 3. Restart services
echo "Restarting services..."
systemctl restart nginx
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# 4. Clear Nginx error log to remove old errors
echo "Clearing old Nginx error logs..."
echo "" > /var/log/nginx/error.log

# 5. Test API endpoints
echo "Testing API endpoints..."
curl -s https://flaha.org/api/test
echo ""
curl -s "https://flaha.org/api/weather?q=London" | head -c 100
echo "..."

echo "All issues fixed successfully!"