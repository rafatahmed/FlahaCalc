#!/bin/bash

# Exit on error
set -e

echo "Setting up API key configuration..."

# Create .env.example file if it doesn't exist
if [ ! -f "EVAPOTRAN/server/.env.example" ]; then
  cat > EVAPOTRAN/server/.env.example << 'EOF'
# OpenWeatherMap API Key
# Get your API key from https://openweathermap.org/api
WEATHER_API_KEY=your_api_key_here

# Server port (default: 3000)
PORT=3000
EOF
  echo "Created .env.example file"
fi

# Check if .env file exists on the server
if [ -f "EVAPOTRAN/server/.env" ]; then
  echo "Server .env file exists, will be preserved during deployment"
else
  echo "WARNING: No .env file found in EVAPOTRAN/server/"
  echo "You will need to create one on the server with your OpenWeatherMap API key"
  
  # Create a placeholder .env file that will be used during development
  # but won't be deployed to the server (add to .gitignore)
  cat > EVAPOTRAN/server/.env << 'EOF'
# OpenWeatherMap API Key - DEVELOPMENT ONLY
# This file is not deployed to the server and is for local development only
WEATHER_API_KEY=your_api_key_here

# Server port (default: 3000)
PORT=3000
EOF
  
  # Add .env to .gitignore if it's not already there
  if ! grep -q "EVAPOTRAN/server/.env" .gitignore 2>/dev/null; then
    echo "EVAPOTRAN/server/.env" >> .gitignore
    echo "Added EVAPOTRAN/server/.env to .gitignore"
  fi
fi

# Add instructions to README
cat > EVAPOTRAN/server/API_KEY_SETUP.md << 'EOF'
# API Key Setup

The weather functionality requires an OpenWeatherMap API key to work properly.

## Getting an API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/) and create an account
2. Navigate to your API keys section
3. Generate a new API key or use an existing one

## Setting up the API Key

### For Development

1. Create a `.env` file in the `EVAPOTRAN/server/` directory
2. Add your API key to the file:
   ```
   WEATHER_API_KEY=your_api_key_here
   PORT=3000
   ```

### For Production

1. SSH into your server
2. Navigate to the server directory: `cd /var/www/flahacalc/EVAPOTRAN/server/`
3. Create a `.env` file: `nano .env`
4. Add your API key to the file:
   ```
   WEATHER_API_KEY=your_api_key_here
   PORT=3000
   ```
5. Save the file and restart the server: `pm2 restart flahacalc-server`

## Troubleshooting

If you see an "Invalid API key" error:

1. Verify your API key is correct
2. Check that the `.env` file exists on the server
3. Make sure the server has been restarted after adding the API key
4. Check the server logs: `pm2 logs flahacalc-server`
EOF

echo "API key configuration setup complete!"