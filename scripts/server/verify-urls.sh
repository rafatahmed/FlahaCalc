#!/bin/bash

echo "Verifying all website URLs..."

# Define the domain
DOMAIN="flaha.org"

# Define the URLs to check
URLS=(
  "http://$DOMAIN/"
  "http://$DOMAIN/pa/"
  "http://$DOMAIN/pa/evapotran/"
  "http://$DOMAIN/api/test"
  "http://$DOMAIN/api/weather?q=London"
)

# Check each URL
for url in "${URLS[@]}"; do
  echo "Testing $url..."
  
  # Get HTTP status code
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  # Get response content (limited to first 100 characters)
  RESPONSE=$(curl -s "$url" | head -c 100)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Status: $HTTP_CODE (OK)"
    echo "Response preview: $RESPONSE..."
  else
    echo "❌ Status: $HTTP_CODE (Error)"
    echo "Response preview: $RESPONSE..."
  fi
  echo ""
done

echo "URL verification complete!"