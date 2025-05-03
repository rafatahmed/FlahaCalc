#!/bin/bash

# Exit on error
set -e

echo "Verifying API endpoint functionality..."

# Test the server's test endpoint
echo "Testing server connectivity..."
RESPONSE=$(curl -s "http://localhost:3000/api/test")

if echo "$RESPONSE" | grep -q "Server is running correctly"; then
    echo "✓ Server test endpoint is working"
else
    echo "✗ Server test endpoint is NOT working"
    echo "Response: $RESPONSE"
fi

# Test the weather endpoint with London
echo "Testing weather endpoint with London..."
RESPONSE=$(curl -s "http://localhost:3000/api/weather?q=London")

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "✗ Weather endpoint test FAILED: Invalid API key"
    echo "Response: $RESPONSE"
elif echo "$RESPONSE" | grep -q "name"; then
    echo "✓ Weather endpoint test PASSED"
    echo "Weather data successfully retrieved"
else
    echo "? Weather endpoint test INCONCLUSIVE"
    echo "Response: $RESPONSE"
fi

# Check Nginx configuration
echo "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-enabled/flahacalc" ]; then
    echo "✓ Nginx configuration exists"
    
    # Check if API proxy is configured correctly
    if grep -q "location /api/" /etc/nginx/sites-enabled/flahacalc; then
        echo "✓ API proxy configuration exists"
        
        # Extract the proxy_pass line
        PROXY_PASS=$(grep "proxy_pass" /etc/nginx/sites-enabled/flahacalc | head -1)
        echo "Proxy configuration: $PROXY_PASS"
    else
        echo "✗ API proxy configuration is MISSING"
    fi
else
    echo "✗ Nginx configuration is MISSING"
fi

# Test the API through Nginx
echo "Testing API through Nginx..."
DOMAIN=$(grep "server_name" /etc/nginx/sites-enabled/flahacalc | head -1 | awk '{print $2}' | tr -d ';')
echo "Using domain: $DOMAIN"

RESPONSE=$(curl -s "https://$DOMAIN/api/test")
if echo "$RESPONSE" | grep -q "Server is running correctly"; then
    echo "✓ API through Nginx test endpoint is working"
else
    echo "✗ API through Nginx test endpoint is NOT working"
    echo "Response: $RESPONSE"
fi

RESPONSE=$(curl -s "https://$DOMAIN/api/weather?q=London")
if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "✗ Weather through Nginx test FAILED: Invalid API key"
    echo "Response: $RESPONSE"
elif echo "$RESPONSE" | grep -q "name"; then
    echo "✓ Weather through Nginx test PASSED"
    echo "Weather data successfully retrieved"
else
    echo "? Weather through Nginx test INCONCLUSIVE"
    echo "Response: $RESPONSE"
fi

echo "Verification complete. Please check the results above."