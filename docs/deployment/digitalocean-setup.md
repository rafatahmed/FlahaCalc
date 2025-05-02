# DigitalOcean Droplet Setup for FlahaCalc

## Initial Server Setup

1. Create a new Droplet with the following specifications:
   - Ubuntu 22.04 LTS
   - Basic plan ($5-$10/month depending on your needs)
   - Choose a datacenter region close to your target users
   - Add your SSH key for secure access

2. Once the Droplet is created, SSH into it:
   ```bash
   ssh root@your-droplet-ip
   ```

3. Update the system and install required packages:
   ```bash
   apt update && apt upgrade -y
   apt install -y nginx certbot python3-certbot-nginx git
   ```

4. Install Node.js and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   npm install -g pm2
   ```

## Application Setup

1. Create a directory for the application:
   ```bash
   mkdir -p /var/www/flahacalc
   chown -R $USER:$USER /var/www/flahacalc
   ```

2. Clone your repository:
   ```bash
   cd /var/www/flahacalc
   git clone https://github.com/your-username/flahacalc.git .
   ```

3. Install dependencies and build the application:
   ```bash
   npm ci
   cd EVAPOTRAN/server
   npm ci
   cd ../..
   npm run build
   ```

4. Set up environment variables:
   ```bash
   cd EVAPOTRAN/server
   cp .env.example .env
   nano .env
   ```
   Add your environment variables:
   ```
   WEATHER_API_KEY=your_openweathermap_api_key
   JWT_SECRET=your_secure_random_string
   PORT=3000
   ```

5. Start the server with PM2:
   ```bash
   pm2 start server.js --name flahacalc-server
   pm2 save
   pm2 startup
   ```

## Nginx Configuration

1. Create a new Nginx server block:
   ```bash
   nano /etc/nginx/sites-available/flahacalc
   ```

2. Add the following configuration:
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

3. Enable the site and test the configuration:
   ```bash
   ln -s /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

4. Set up SSL with Certbot:
   ```bash
   certbot --nginx -d your-domain.com -d www.your-domain.com
   ```
