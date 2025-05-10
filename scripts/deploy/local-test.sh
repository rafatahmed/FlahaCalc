#!/bin/bash

# Exit on error
set -e

echo "Starting local test deployment for FlahaCalc..."

# 1. Install dependencies
echo "Installing dependencies..."
npm install
cd EVAPOTRAN/server
npm install
cd ../..

# 2. Build the application
echo "Building application..."
npm run build

# 3. Create .env file if it doesn't exist
if [ ! -f "EVAPOTRAN/server/.env" ]; then
  echo "Creating .env file..."
  read -p "Enter your OpenWeatherMap API key: " API_KEY
  
  cat > EVAPOTRAN/server/.env << EOF
# OpenWeatherMap API Key
WEATHER_API_KEY=$API_KEY

# Server port (default: 3000)
PORT=3000
EOF
fi

# 4. Start the server
echo "Starting server..."
cd EVAPOTRAN/server
node server.js &
SERVER_PID=$!

# 5. Wait for server to start
echo "Waiting for server to start..."
sleep 3

# 6. Run tests
echo "Running tests..."
curl -s http://localhost:3000/api/test
echo ""

# 7. Test weather API
echo "Testing weather API..."
WEATHER_RESPONSE=$(curl -s "http://localhost:3000/api/weather?q=London")
if echo "$WEATHER_RESPONSE" | grep -q "Invalid API key"; then
  echo "⚠️ Weather API needs a valid API key"
elif echo "$WEATHER_RESPONSE" | grep -q "name"; then
  echo "✅ Weather API is working"
else
  echo "❌ Weather API is not working"
  echo "Response: $WEATHER_RESPONSE"
fi

# 8. Open browser
echo "Opening browser..."
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:3000
elif command -v open > /dev/null; then
  open http://localhost:3000
elif command -v start > /dev/null; then
  start http://localhost:3000
else
  echo "Could not open browser automatically. Please open http://localhost:3000 manually."
fi

# 9. Wait for user to finish testing
echo ""
echo "Local test server is running. Press Enter to stop the server and clean up."
read

# 10. Clean up
echo "Stopping server..."
kill $SERVER_PID

echo "Local test deployment completed!"