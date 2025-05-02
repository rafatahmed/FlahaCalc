# Monitoring and Backup Plan

## Monitoring

1. Set up basic monitoring with PM2:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. Set up DigitalOcean Monitoring:
   - Enable DigitalOcean Monitoring for your Droplet
   - Set up alert policies for CPU, memory, and disk usage

## Backups

1. Enable DigitalOcean Backups:
   - Go to your Droplet settings
   - Enable weekly backups

2. Set up a database backup script (when you implement a database):
   ```bash
   mkdir -p /var/backups/evapotran
   
   # Create a backup script
   cat > /usr/local/bin/backup-evapotran.sh << 'EOF'
   #!/bin/bash
   
   DATE=$(date +%Y-%m-%d)
   BACKUP_DIR="/var/backups/evapotran"
   
   # Backup database (example for MongoDB)
   mongodump --out "$BACKUP_DIR/mongodb-$DATE"
   
   # Compress the backup
   tar -czf "$BACKUP_DIR/mongodb-$DATE.tar.gz" "$BACKUP_DIR/mongodb-$DATE"
   rm -rf "$BACKUP_DIR/mongodb-$DATE"
   
   # Keep only the last 7 backups
   find "$BACKUP_DIR" -name "mongodb-*.tar.gz" -type f -mtime +7 -delete
   EOF
   
   # Make the script executable
   chmod +x /usr/local/bin/backup-evapotran.sh
   
   # Add to crontab to run daily
   (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-evapotran.sh") | crontab -
   ```