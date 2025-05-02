# FlahaCalc Deployment Quick Start Guide

This guide provides a quick overview of how to deploy FlahaCalc to production.

## Prerequisites

1. A GitHub account with access to the FlahaCalc repository
2. A DigitalOcean account
3. A domain name (optional but recommended)

## Step 1: Create a DigitalOcean Droplet

1. Log in to DigitalOcean
2. Create a new Droplet with Ubuntu 22.04 LTS
3. Choose the Basic plan ($5-$10/month)
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
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y nginx certbot python3-certbot-nginx git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Create application directory
mkdir -p /var/www/flahacalc
```

## Step 4: Deploy Manually for the First Time

```bash
# Clone the repository
cd /var/www/flahacalc
git clone https://github.com/your-username/flahacalc.git .

# Install dependencies
npm install
cd EVAPOTRAN/server
npm install

# Create .env file
cp .env.example .env  # If .env.example exists
nano .env  # Add your environment variables

# Build the application
cd ../..
npm run build

# Start the server
cd EVAPOTRAN/server
pm2 start server.js --name flahacalc-server
pm2 save
pm2 startup
```

## Step 5: Configure Nginx

```bash
# Create Nginx config
nano /etc/nginx/sites-available/flahacalc
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        root /var/www/flahacalc/EVAPOTRAN;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable the site:
```bash
ln -s /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Set up SSL (if you have a domain)
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 6: Test Automatic Deployment

Make a small change to your repository, commit, and push to the main branch. The GitHub Actions workflow should automatically deploy the changes to your Droplet.

## Step 7: Verify Deployment

1. Visit your domain or Droplet IP in a web browser
2. Check the logs: `pm2 logs flahacalc-server`
3. Check the application status: `pm2 status`