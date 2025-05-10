#!/bin/bash

# Set up log file
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/monitor-$(date +%Y%m%d).log"

# Function to log issues
log_issue() {
  local severity=$1
  local message=$2
  echo "[$severity] $message" | tee -a $LOG_FILE
}

echo "===== EVAPOTRAN Local Monitoring ====="
echo "Date: $(date)"
echo "Log file: $LOG_FILE"
echo ""

# Check if server.js has syntax errors
echo "===== Checking server.js syntax ====="
node -c server/server.js
if [ $? -eq 0 ]; then
  echo "✅ server.js syntax is valid"
else
  log_issue "CRITICAL" "server.js has syntax errors"
fi

# Check if .env file exists and has API key
echo ""
echo "===== Checking .env file ====="
if [ -f "server/.env" ]; then
  echo "✅ .env file exists"
  if grep -q "WEATHER_API_KEY=" server/.env; then
    API_KEY=$(grep "WEATHER_API_KEY=" server/.env | cut -d= -f2)
    if [ -z "$API_KEY" ] || [ "$API_KEY" = "your_api_key_here" ]; then
      log_issue "CRITICAL" "API key is not set in .env file"
    else
      echo "✅ API key is set in .env file"
      
      # Test API key
      echo ""
      echo "===== Testing API key ====="
      RESPONSE=$(curl -s "https://api.openweathermap.org/data/2.5/weather?q=London&appid=$API_KEY")
      if [[ "$RESPONSE" == *"Invalid API key"* ]]; then
        log_issue "CRITICAL" "Invalid API key"
      elif [[ "$RESPONSE" == *"name"*"London"* ]]; then
        echo "✅ API key is valid"
      else
        log_issue "WARNING" "Unexpected response from OpenWeatherMap API"
        echo "Response: $RESPONSE"
      fi
    fi
  else
    log_issue "CRITICAL" "WEATHER_API_KEY not found in .env file"
  fi
else
  log_issue "CRITICAL" ".env file not found"
fi

echo ""
echo "===== Monitoring completed ====="
echo "Check the log file for details: $LOG_FILE"