# EVAPOTRAN Deployment Guide

This document outlines the deployment process for the EVAPOTRAN application.

## Deployment Architecture

EVAPOTRAN uses a simple but effective deployment architecture:

1. **GitHub Repository**: Source code management and CI/CD trigger
2. **GitHub Actions**: Automated build and deployment pipeline
3. **DigitalOcean Droplet**: Ubuntu server hosting the application
4. **Nginx**: Web server and reverse proxy
5. **PM2**: Node.js process manager
6. **Let's Encrypt**: SSL certificate provider

## Deployment Methods

### Automatic Deployment

The application is automatically deployed when changes are pushed to the `main` branch:

1. Push changes to GitHub
2. GitHub Actions workflow is triggered
3. Application is built and tested
4. Changes are deployed to the DigitalOcean Droplet
5. Server is restarted

### Manual Deployment

For manual deployment:

```bash
npm run deploy:manual
```

## Monitoring and Maintenance

- **Logs**: Available via PM2 (`pm2 logs evapotran-server`)
- **Performance Monitoring**: DigitalOcean Monitoring dashboard
- **Backups**: Automated weekly backups via DigitalOcean

## Troubleshooting

If the deployment fails:

1. Check GitHub Actions logs for build errors
2. Check server logs: `pm2 logs evapotran-server`
3. Verify Nginx configuration: `nginx -t`
4. Check application status: `pm2 status`

## Rollback Procedure

To rollback to a previous version:

1. Find the commit hash of the stable version
2. SSH into the server
3. Navigate to the application directory: `cd /var/www/evapotran`
4. Checkout the stable version: `git checkout <commit-hash>`
5. Rebuild and restart: `npm ci && npm run build && cd EVAPOTRAN/server && npm ci && pm2 restart evapotran-server`