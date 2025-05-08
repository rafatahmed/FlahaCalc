# Deployment Guide

## Server Configuration

The application is deployed on a DigitalOcean droplet with the following configuration:

- **Server**: Ubuntu 20.04
- **Web Server**: Nginx
- **Node.js**: v16.x
- **Process Manager**: PM2

## URL Structure

- Main site: `https://flaha.org/`
- PA division: `https://flaha.org/pa/`
- EVAPOTRAN application: `https://flaha.org/pa/evapotran/`

## Directory Structure

- `/var/www/flahacalc/` - Main application directory
  - `/EVAPOTRAN/` - EVAPOTRAN application (served at `/pa/evapotran/`)
  - `/pa/` - PA division

## Deployment Process

The application is automatically deployed using GitHub Actions when changes are pushed to the main branch.

### Manual Deployment

If you need to deploy manually:

1. SSH into the server:
   ```
   ssh root@207.154.202.6
   ```

2. Navigate to the application directory:
   ```
   cd /var/www/flahacalc
   ```

3. Pull the latest changes:
   ```
   git pull origin main
   ```

4. Run the post-deployment script:
   ```
   bash scripts/server/post-deploy.sh
   ```

## Troubleshooting

### API Not Working

1. Check if the Node.js server is running:
   ```
   pm2 status
   ```

2. Restart the server if needed:
   ```
   pm2 restart flahacalc-server
   ```

3. Check server logs:
   ```
   pm2 logs flahacalc-server
   ```

### Nginx Issues

1. Test Nginx configuration:
   ```
   nginx -t
   ```

2. Check Nginx logs:
   ```
   tail -f /var/log/nginx/error.log
   ```

3. Restart Nginx:
   ```
   systemctl restart nginx
   ```