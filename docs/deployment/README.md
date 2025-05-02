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
4. Changes are deployed to the DigitalOcean Droplet via SSH
5. Server is restarted

### Manual Deployment

For manual deployment:

```bash
# Deploy from your local machine
npm run deploy:production

# Or SSH into the server and run
ssh -i ~/.ssh/rafat root@207.154.202.6
cd /var/www/flahacalc
bash scripts/deploy/production.sh
```

## Scripts Organization

All deployment scripts are organized in the `scripts/` directory:

- `scripts/deploy/` - Deployment scripts
- `scripts/security/` - Security-related scripts
- `scripts/server/` - Server management scripts
- `scripts/dev/` - Development scripts

## Monitoring and Maintenance

- **Logs**: Available via PM2 (`pm2 logs flahacalc-server`)
- **Performance Monitoring**: Run `npm run server:monitor`
- **Backups**: Run `npm run server:backup`

## Troubleshooting

If the deployment fails:

1. Check GitHub Actions logs for build errors
2. Check server logs: `pm2 logs flahacalc-server`
3. Verify Nginx configuration: `nginx -t`
4. Check application status: `pm2 status`

## Rollback Procedure

To rollback to a previous version:

1. Find the commit hash of the stable version
2. SSH into the server
3. Navigate to the application directory: `cd /var/www/flahacalc`
4. Checkout the stable version: `git checkout <commit-hash>`
5. Rebuild and restart: `npm ci && npm run build && cd EVAPOTRAN/server && npm ci && pm2 restart flahacalc-server`

