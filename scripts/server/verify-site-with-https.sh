#!/bin/bash

echo "Verifying site functionality with HTTPS support..."

# 1. Check Nginx status
echo "1. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

# 2. Check Node.js server
echo "2. Checking Node.js server..."
if pm2 list | grep -q "flahacalc-server.*online"; then
    echo "✅ Node.js server is running"
else
    echo "❌ Node.js server is not running"
fi

# 3. Test API endpoints
echo "3. Testing API endpoints..."
API_RESPONSE=$(curl -s http://localhost:3000/api/test)
if [[ "$API_RESPONSE" == *"status"*"ok"* ]]; then
    echo "✅ API test endpoint is working"
else
    echo "❌ API test endpoint is not working"
    echo "Response: $API_RESPONSE"
fi

# 4. Test weather API
echo "4. Testing weather API..."
WEATHER_RESPONSE=$(curl -s http://localhost:3000/api/weather?q=London)
if [[ "$WEATHER_RESPONSE" == *"Invalid API key"* ]]; then
    echo "⚠️ Weather API needs a valid API key"
    echo "Please update the API key in /var/www/flahacalc/EVAPOTRAN/server/.env"
elif [[ "$WEATHER_RESPONSE" == *"name"*"London"* ]]; then
    echo "✅ Weather API is working"
else
    echo "❌ Weather API is not working"
    echo "Response: $WEATHER_RESPONSE"
fi

# 5. Check Nginx configuration
echo "5. Checking Nginx configuration..."
NGINX_CONFIG=$(cat /etc/nginx/sites-enabled/flahacalc)
echo "$NGINX_CONFIG" | head -n 10

if echo "$NGINX_CONFIG" | grep -q "listen 443 ssl"; then
    echo "✅ HTTPS is configured"
    
    # Get the domain name
    DOMAIN=$(echo "$NGINX_CONFIG" | grep "server_name" | head -1 | awk '{print $2}' | tr -d ';')
    echo "Domain: $DOMAIN"
    
    # Check if SSL certificate exists
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "✅ SSL certificate exists"
        
        # Check certificate expiration
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        
        echo "SSL certificate expires in $DAYS_LEFT days"
    else
        echo "❌ SSL certificate not found"
    fi
else
    echo "❌ HTTPS is not configured"
fi

# 6. Check site accessibility with proper protocol
echo "6. Checking site accessibility..."
DOMAIN=$(echo "$NGINX_CONFIG" | grep "server_name" | head -1 | awk '{print $2}' | tr -d ';')

if echo "$NGINX_CONFIG" | grep -q "listen 443 ssl"; then
    PROTOCOL="https"
else
    PROTOCOL="http"
fi

echo "Using protocol: $PROTOCOL"
echo "Using domain: $DOMAIN"

URLS=(
    "$PROTOCOL://$DOMAIN/"
    "$PROTOCOL://$DOMAIN/EVAPOTRAN/"
)

for url in "${URLS[@]}"; do
    echo "Checking $url..."
    HTTP_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Accessible (HTTP $HTTP_CODE)"
    else
        echo "❌ Not accessible (HTTP $HTTP_CODE)"
    fi
done

# 7. Check if API is accessible through Nginx
echo "7. Checking if API is accessible through Nginx..."
API_URL="$PROTOCOL://$DOMAIN/api/test"
echo "Checking $API_URL..."
HTTP_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" "$API_URL")
API_RESPONSE=$(curl -s -k "$API_URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is accessible through Nginx (HTTP $HTTP_CODE)"
    echo "Response: $API_RESPONSE"
else
    echo "❌ API is not accessible through Nginx (HTTP $HTTP_CODE)"
    echo "Response: $API_RESPONSE"
fi

echo "Verification complete!"