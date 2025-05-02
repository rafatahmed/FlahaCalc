# PM2 Process Management Setup

1. Navigate to the server directory:
   ```bash
   cd /var/www/evapotran/EVAPOTRAN/server
   ```

2. Start the server with PM2:
   ```bash
   pm2 start server.js --name evapotran-server
   ```

3. Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

4. Monitor the application:
   ```bash
   pm2 status
   pm2 logs evapotran-server
   ```