# Nginx Configuration

1. Create a new Nginx server block:
   ```bash
   nano /etc/nginx/sites-available/evapotran
   ```

2. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       location / {
           root /var/www/evapotran/EVAPOTRAN;
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
   ln -s /etc/nginx/sites-available/evapotran /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

4. Set up SSL with Certbot:
   ```bash
   certbot --nginx -d your-domain.com -d www.your-domain.com
   ```