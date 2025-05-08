#!/bin/bash

echo "Performing comprehensive verification of all components..."

# Check directory structure
echo "Checking directory structure..."
for dir in "/var/www/flahacalc" "/var/www/flahacalc/pa" "/var/www/flahacalc/EVAPOTRAN" "/var/www/flahacalc/EVAPOTRAN/server"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir exists"
    else
        echo "❌ $dir is missing"
    fi
done

# Check key files
echo "Checking key files..."
for file in "/var/www/flahacalc/index.html" "/var/www/flahacalc/pa/index.html" "/var/www/flahacalc/EVAPOTRAN/index.html" "/var/www/flahacalc/EVAPOTRAN/server/server.js"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
    fi
done

# Check Node.js server
echo "Checking Node.js server..."
if pm2 list | grep -q "flahacalc-server"; then
    echo "✅ Node.js server is running with PM2"
else
    echo "❌ Node.js server is not running"
fi

# Check API key configuration
echo "Checking API key configuration..."
if [ -f "/var/www/flahacalc/EVAPOTRAN/server/.env" ]; then
    echo "✅ .env file exists"
    if grep -q "WEATHER_API_KEY=" "/var/www/flahacalc/EVAPOTRAN/server/.env"; then
        API_KEY=$(grep "WEATHER_API_KEY=" "/var/www/flahacalc/EVAPOTRAN/server/.env" | cut -d= -f2)
        if [ "$API_KEY" = "your_api_key_here" ]; then
            echo "⚠️ Default API key is being used. Please update with a real API key."
        else
            echo "✅ API key is configured"
        fi
    else
        echo "❌ API key is missing in .env file"
    fi
else
    echo "❌ .env file is missing"
fi

# Check Nginx configuration
echo "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/flahacalc" ]; then
    echo "✅ Nginx configuration file exists"
    
    # Check for key configuration sections
    if grep -q "location /pa/evapotran/" "/etc/nginx/sites-available/flahacalc"; then
        echo "✅ EVAPOTRAN location is configured in Nginx"
    else
        echo "❌ EVAPOTRAN location is missing in Nginx configuration"
    fi
    
    if grep -q "location /api/" "/etc/nginx/sites-available/flahacalc"; then
        echo "✅ API proxy is configured in Nginx"
    else
        echo "❌ API proxy is missing in Nginx configuration"
    fi
else
    echo "❌ Nginx configuration file is missing"
fi

# Test API endpoints
echo "Testing API endpoints..."
TEST_RESPONSE=$(curl -s "http://localhost:3000/api/test")
if echo "$TEST_RESPONSE" | grep -q "Server is running correctly"; then
    echo "✅ API test endpoint is working"
else
    echo "❌ API test endpoint is not working"
    echo "Response: $TEST_RESPONSE"
fi

WEATHER_RESPONSE=$(curl -s "http://localhost:3000/api/weather?q=London")
if echo "$WEATHER_RESPONSE" | grep -q "Weather API key is not configured"; then
    echo "⚠️ Weather API needs a valid API key"
elif echo "$WEATHER_RESPONSE" | grep -q "Invalid API key"; then
    echo "⚠️ Weather API key is invalid"
elif echo "$WEATHER_RESPONSE" | grep -q "name"; then
    echo "✅ Weather API is working"
else
    echo "❌ Weather API is not working"
    echo "Response: $WEATHER_RESPONSE"
fi

# Test website URLs
echo "Testing website URLs..."
DOMAIN="flaha.org"

for url in "http://$DOMAIN/" "http://$DOMAIN/pa/" "http://$DOMAIN/pa/evapotran/"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ $url is accessible (HTTP $HTTP_CODE)"
    else
        echo "❌ $url is not accessible (HTTP $HTTP_CODE)"
    fi
done

echo "Verification complete!"
