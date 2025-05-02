# Production Deployment Checklist

## Before Deployment

- [ ] Run pre-deployment checks: `npm run pre-deploy`
- [ ] Test the application locally with production settings
- [ ] Ensure all API keys and secrets are properly secured
- [ ] Update version numbers in relevant files
- [ ] Commit all changes to the repository

## Server Setup (First Time Only)

- [ ] Set up a DigitalOcean Droplet with Ubuntu 22.04
- [ ] Install required packages:
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y nginx git
  ```
- [ ] Install Node.js:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
- [ ] Install PM2:
  ```bash
  sudo npm install -g pm2
  ```
- [ ] Set up the application directory:
  ```bash
  sudo mkdir -p /var/www/flahacalc
  sudo chown $USER:$USER /var/www/flahacalc
  ```
- [ ] Clone the repository:
  ```bash
  cd /var/www/flahacalc
  git clone https://github.com/your-username/flahacalc.git .
  ```
- [ ] Set up Nginx (see nginx-config.md)
- [ ] Set up SSL with Let's Encrypt

## Deployment Process

- [ ] Push changes to GitHub
- [ ] Verify GitHub Actions workflow completes successfully
- [ ] Check the application is working correctly on the production server
- [ ] Verify API endpoints are working
- [ ] Check server logs for any errors:
  ```bash
  pm2 logs flahacalc-server
  ```

## Post-Deployment

- [ ] Monitor application performance
- [ ] Check for any errors in the logs
- [ ] Verify all features are working correctly
- [ ] Update documentation if needed