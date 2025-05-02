# Scripts Directory

This directory contains all scripts used for development, deployment, and server management.

## Directory Structure

- `deploy/` - Deployment-related scripts
  - `production.sh` - Deploy to production server
  - `local.sh` - Deploy locally for testing
  - `pre-deploy-check.sh` - Run pre-deployment checks
  - `update-links.sh` - Update HTML links for production
  - `update-js-links.sh` - Update JavaScript links for production

- `security/` - Security-related scripts
  - `audit.sh` - Run security audit
  - `server-hardening.sh` - Harden server security
  - `setup-env.sh` - Set up secure environment variables

- `server/` - Server management scripts
  - `backup.sh` - Backup server data
  - `droplet-setup.sh` - Set up DigitalOcean droplet
  - `monitor.sh` - Monitor server status

- `dev/` - Development utility scripts
  - `build.sh` - Build the application
  - `clean.sh` - Clean the project

## Usage

Most scripts can be run directly:

```bash
bash scripts/deploy/production.sh
```

Or through npm scripts defined in package.json:

```bash
npm run deploy:production
```

## Adding New Scripts

When adding new scripts:

1. Place them in the appropriate directory
2. Make them executable: `chmod +x scripts/category/script.sh`
3. Add a reference in this README
4. Consider adding an npm script in package.json
