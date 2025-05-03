# Post-Deployment Optimization

After deploying the application to your server, follow these steps to apply performance optimizations.

## 1. Connect to Your Server

SSH into your server:

```bash
ssh $DROPLET_USERNAME@$DROPLET_HOST
```

## 2. Navigate to the Application Directory

```bash
cd /var/www/flahacalc
```

## 3. Run the Optimization Script

```bash
# Make sure the script is executable
chmod +x scripts/server/optimize-server.sh

# Run the optimization script
bash scripts/server/optimize-server.sh
```

This script will:
- Install required performance dependencies (node-cache, express-rate-limit, compression, morgan)
- Apply server-side optimizations
- Restart the server to apply changes

## 4. Verify Optimizations

Check that the optimizations were applied successfully:

```bash
# Check server logs for optimization messages
pm2 logs flahacalc-server --lines 20

# Test server response with compression
curl -I -H "Accept-Encoding: gzip" https://yourdomain.com/api/test
```

You should see `Content-Encoding: gzip` in the response headers, indicating compression is working.

## 5. Monitor Performance

After applying optimizations, monitor the server performance:

```bash
# Check server status
pm2 status

# Monitor server resources
pm2 monit
```

## Troubleshooting

If you encounter issues after optimization:

1. Check error logs:
   ```bash
   pm2 logs flahacalc-server --err --lines 50
   ```

2. Verify dependencies were installed:
   ```bash
   cd /var/www/flahacalc/EVAPOTRAN/server
   npm list | grep -E 'node-cache|express-rate-limit|compression|morgan'
   ```

3. If necessary, restart the server:
   ```bash
   pm2 restart flahacalc-server
   ```

## Automation Option

To automate this process for future deployments, add the optimization step to your deployment workflow:

```bash
# In your deploy.sh script, add:
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF'
cd /var/www/flahacalc
bash scripts/server/optimize-server.sh
EOF
```

This will automatically run the optimization script after each deployment.