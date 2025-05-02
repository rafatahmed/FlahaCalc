#!/bin/bash

# Exit on error
set -e

echo "Setting up secure environment variables..."

# Generate a secure random string for JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > /var/www/flahacalc/EVAPOTRAN/server/.env << EOF
# API Keys
WEATHER_API_KEY=your_openweathermap_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN=1

# Security
CORS_ORIGIN=https://flaha.org,https://www.flaha.org
EOF

# Set proper permissions
chmod 600 /var/www/flahacalc/EVAPOTRAN/server/.env
chown root:root /var/www/flahacalc/EVAPOTRAN/server/.env

echo "Environment variables set up successfully!"
