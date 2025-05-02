# Production Deployment Configuration

## Server Setup

1. Ensure Node.js and PM2 are installed on the server:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```

2. Set up the Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name flaha.org www.flaha.org;
       
       location / {
           root /var/www/flahacalc/EVAPOTRAN;
           index index.html;
           try_files $uri $uri/ /index.html;
       }
       
       location /api/ {
           proxy_pass http://localhost:3000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Configure SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d flaha.org -d www.flaha.org
   ```

4. Set up the weather API server with PM2:
   ```bash
   cd /var/www/flahacalc/EVAPOTRAN/server
   npm install
   pm2 start server.js --name flahacalc-server
   pm2 save
   pm2 startup
   ```