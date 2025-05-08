#!/bin/bash

echo "Fixing permissions and webpack issues..."

# 1. Fix Git ownership issue
echo "1. Fixing Git ownership issue..."
git config --global --add safe.directory /var/www/flahacalc
echo "✅ Git ownership issue fixed"

# 2. Fix webpack permissions
echo "2. Fixing webpack permissions..."
chmod -R 755 node_modules/.bin/
echo "✅ Webpack permissions fixed"

# 3. Fix all script permissions
echo "3. Fixing all script permissions..."
find scripts -name "*.sh" -exec chmod +x {} \;
echo "✅ Script permissions fixed"

# 4. Fix Node.js server
echo "4. Fixing Node.js server..."
cd EVAPOTRAN/server
npm install
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save
cd ../..
echo "✅ Node.js server restarted"

# 5. Test API endpoint
echo "5. Testing API endpoint..."
API_RESPONSE=$(curl -s http://localhost:3000/api/test)
if [[ "$API_RESPONSE" == *"status"*"ok"* ]]; then
    echo "✅ API endpoint is working"
else
    echo "❌ API endpoint is not working"
    echo "Response: $API_RESPONSE"
    
    echo "Checking server logs..."
    pm2 logs flahacalc-server --lines 10
    
    echo "Checking if server.js exists and has correct content..."
    if [ -f EVAPOTRAN/server/server.js ]; then
        echo "✅ server.js exists"
        head -n 20 EVAPOTRAN/server/server.js
    else
        echo "❌ server.js does not exist"
    fi
fi

# 6. Try rebuilding the application
echo "6. Rebuilding the application..."
npm run build

echo "Fix completed. Please check if the site is working now."