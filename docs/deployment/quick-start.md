# FlahaCalc Deployment Quick Start Guide

This guide provides a quick overview of how to deploy FlahaCalc to production.

## Prerequisites

1. A GitHub account with access to the FlahaCalc repository
2. A DigitalOcean account
3. A domain name (optional but recommended)

## Step 1: Create a DigitalOcean Droplet

1. Log in to DigitalOcean
2. Create a new Droplet with Ubuntu 22.04 LTS
3. Choose the Basic plan ($5-$10-month)
4. Add your SSH key
5. Create the Droplet

## Step 2: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `DROPLET_HOST`: Your Droplet's IP address
   - `DROPLET_USERNAME`: Usually 'root'
   - `DROPLET_SSH_KEY`: Your private SSH key (base64 encoded)

## Step 3: Initial Server Setup

SSH into your Droplet and run:

```bash
# Download the setup script
curl -o setup.sh https://raw.githubusercontent.com/your-username/flahacalc/main/scripts/droplet-setup.sh

# Make it executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

## Step 4: Configure Domain and SSL

1. Point your domain to your Droplet's IP address
2. Set up SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

## Step 5: Test Automatic Deployment

Make a small change to your repository, commit, and push to the main branch. The GitHub Actions workflow should automatically deploy the changes to your Droplet.

## Step 6: Verify Deployment

1. Visit your domain or Droplet IP in a web browser
2. Check the logs: `pm2 logs flahacalc-server`
3. Check the application status: `pm2 status`

## Troubleshooting

If you encounter issues:

1. Check GitHub Actions logs for build errors
2. Check server logs: `pm2 logs flahacalc-server`
3. Verify Nginx configuration: `nginx -t`
4. Check application status: `pm2 status`
