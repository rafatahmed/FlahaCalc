#!/bin/bash

echo "Verifying EVAPOTRAN functionality..."

# 1. Check if the site is accessible
echo "Checking if EVAPOTRAN is accessible..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://flaha.org/pa/evapotran/)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ EVAPOTRAN is accessible (HTTP 200)"
else
    echo "❌ EVAPOTRAN is not accessible (HTTP $RESPONSE)"
fi

# 2. Check if the JavaScript files are accessible
echo "Checking if JavaScript files are accessible..."
JS_FILES=("script.js" "live-weather.js")
for file in "${JS_FILES[@]}"; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://flaha.org/pa/evapotran/js/$file)
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ $file is accessible (HTTP 200)"
    else
        echo "❌ $file is not accessible (HTTP $RESPONSE)"
    fi
done

# 3. Check if the CSS files are accessible
echo "Checking if CSS files are accessible..."
CSS_FILES=("styles.css")
for file in "${CSS_FILES[@]}"; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://flaha.org/pa/evapotran/css/$file)
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ $file is accessible (HTTP 200)"
    else
        echo "❌ $file is not accessible (HTTP $RESPONSE)"
    fi
done

# 4. Check if the API is accessible
echo "Checking if API is accessible..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://flaha.org/api/test)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ API is accessible (HTTP 200)"
else
    echo "❌ API is not accessible (HTTP $RESPONSE)"
fi

echo "Verification complete!"
