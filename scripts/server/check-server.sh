#!/bin/bash

ALERT_SCRIPT="/var/www/flahacalc/scripts/server/alert.sh"
WEBHOOK_URL="your_slack_webhook_url"  # Replace with your webhook URL

# Check if server is running
if ! curl -s http://localhost:3000/test > /dev/null; then
  $ALERT_SCRIPT "API server is not responding"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
  $ALERT_SCRIPT "Disk usage is at ${DISK_USAGE}%"
fi

# Check memory usage
MEM_AVAILABLE=$(free -m | awk 'NR==2 {print $7}')
if [ "$MEM_AVAILABLE" -lt 100 ]; then
  $ALERT_SCRIPT "Low memory available: ${MEM_AVAILABLE}MB"
fi

# Check for Nginx errors
ERROR_COUNT=$(grep -c "error" /var/log/nginx/error.log)
if [ "$ERROR_COUNT" -gt 100 ]; then
  $ALERT_SCRIPT "High number of Nginx errors: ${ERROR_COUNT}"
fi

# Check SSL certificate expiration
CERT_FILE="/etc/letsencrypt/live/flaha.org/fullchain.pem"
if [ -f "$CERT_FILE" ]; then
  EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
  EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
  CURRENT_EPOCH=$(date +%s)
  DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
  
  if [ "$DAYS_LEFT" -lt 14 ]; then
    $ALERT_SCRIPT "SSL certificate expires in ${DAYS_LEFT} days"
  fi
fi