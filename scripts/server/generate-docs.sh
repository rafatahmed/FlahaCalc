#!/bin/bash

echo "Generating documentation for Flaha website..."

# Create documentation directory
mkdir -p /var/www/flahacalc/docs

# Generate README.md
cat > /var/www/flahacalc/docs/README.md << 'EOF'
# Flaha Website Documentation

## Overview

The Flaha website consists of three main components:
1. Main company website (/)
2. Precision Agriculture Division (/pa/)
3. EVAPOTRAN Calculator (/pa/evapotran/)

## Server Architecture

- **Web Server**: Nginx
- **Application Server**: Node.js with Express
- **Process Manager**: PM2

## Directory Structure

```
/var/www/flahacalc/
├── index.html                # Main company website
├── pa/                       # Precision Agriculture Division
│   └── index.html
├── EVAPOTRAN/                # EVAPOTRAN Calculator application
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── server/               # Node.js API server
│       ├── server.js
│       ├── package.json
│       └── .env              # Environment variables (contains API keys)
├── scripts/                  # Maintenance scripts
│   └── server/
└── docs/                     # Documentation
```

## API Endpoints

The Node.js server provides the following API endpoints:

- **GET /api/test**: Test endpoint to verify server connectivity
- **GET /api/weather?q={location}**: Fetches weather data for the specified location

## Configuration Files

### Nginx Configuration

The Nginx configuration file is located at `/etc/nginx/sites-available/flahacalc`.

### Environment Variables

The Node.js server uses environment variables defined in `/var/www/flahacalc/EVAPOTRAN/server/.env`:

- `WEATHER_API_KEY`: OpenWeatherMap API key

## Maintenance Scripts

The following maintenance scripts are available in the `/var/www/flahacalc/scripts/server/` directory:

- `fix-server-js.sh`: Fixes the Node.js server configuration
- `fix-nginx-evapotran.sh`: Fixes the Nginx configuration for EVAPOTRAN
- `fix-evapotran-paths.sh`: Fixes the EVAPOTRAN paths for the correct URL structure
- `fix-main-site.sh`: Fixes the main site and PA division
- `check-nginx-logs.sh`: Checks Nginx error and access logs
- `verify-urls.sh`: Verifies that all URLs are working correctly
- `harden-security.sh`: Applies security hardening measures
- `verify-all.sh`: Performs a comprehensive verification of all components

## Common Tasks

### Restarting the Node.js Server

```bash
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server
```

### Restarting Nginx

```bash
systemctl restart nginx
```

### Updating the OpenWeatherMap API Key

```bash
cd /var/www/flahacalc
./scripts/server/set-api-key.sh YOUR_NEW_API_KEY
```

### Checking Server Status

```bash
cd /var/www/flahacalc
./scripts/server/verify-all.sh
```

## Troubleshooting

### API Not Working

1. Check if the Node.js server is running:
   ```bash
   pm2 status
   ```

2. Check the server logs:
   ```bash
   pm2 logs flahacalc-server
   ```

3. Verify the API key is correctly set in the .env file:
   ```bash
   cat /var/www/flahacalc/EVAPOTRAN/server/.env
   ```

### Website Not Accessible

1. Check Nginx status:
   ```bash
   systemctl status nginx
   ```

2. Check Nginx error logs:
   ```bash
   tail -n 50 /var/log/nginx/error.log
   ```

3. Verify Nginx configuration:
   ```bash
   nginx -t
   ```

## Security Considerations

- The `.env` file contains sensitive API keys and should be protected
- Regular security updates should be applied to the server
- Nginx is configured with security headers and rate limiting
- Input validation is implemented on the API endpoints
EOF

# Generate server.js documentation
cat > /var/www/flahacalc/EVAPOTRAN/server/README.md << 'EOF'
# EVAPOTRAN API Server

This is the API server for the EVAPOTRAN Calculator application.

## Endpoints

- **GET /api/test**: Test endpoint to verify server connectivity
- **GET /api/weather?q={location}**: Fetches weather data for the specified location

## Configuration

The server uses environment variables defined in the `.env` file:

```
WEATHER_API_KEY=your_openweathermap_api_key
PORT=3000
```

## Dependencies

- express: Web framework
- cors: Cross-Origin Resource Sharing middleware
- axios: HTTP client for making API requests
- dotenv: Environment variable management
- express-rate-limit: Rate limiting middleware

## Starting the Server

The server is managed using PM2:

```bash
# Start the server
pm2 start server.js --name flahacalc-server

# Restart the server
pm2 restart flahacalc-server

# View logs
pm2 logs flahacalc-server
```
EOF

echo "Documentation generated successfully!"
echo "README.md is available at /var/www/flahacalc/docs/README.md"
