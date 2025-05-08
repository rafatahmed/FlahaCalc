#!/bin/bash

# Exit on error
set -e

# Set log file
LOG_DIR="/var/log/flahacalc"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/monitor-$(date +%Y%m%d).log"

# Function to log messages
log() {
  echo "$1"
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
}

# Header
log "===== FlahaCalc Comprehensive Monitoring ====="
log "Date: $(date)"
log "Log file: $LOG_FILE"
log ""

# Check system resources
log "===== System Resources ====="
log "CPU usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4 "%"}' | tee -a $LOG_FILE
log "Memory usage:"
free -h | tee -a $LOG_FILE
log "Disk usage:"
df -h / | tee -a $LOG_FILE
log ""

# Check PM2 status
log "===== PM2 Status ====="
pm2 status | tee -a $LOG_FILE
log ""

# Check Nginx status
log "===== Nginx Status ====="
systemctl status nginx | grep Active | tee -a $LOG_FILE
log ""

# Check SSL certificate
log "===== SSL Certificate Status ====="
CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/flaha.org/fullchain.pem | cut -d= -f 2)
CERT_EXPIRY_SECONDS=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_SECONDS=$(date +%s)
DAYS_REMAINING=$(( ($CERT_EXPIRY_SECONDS - $CURRENT_SECONDS) / 86400 ))
log "SSL certificate expires in $DAYS_REMAINING days"
log ""

# Check API endpoints
log "===== API Endpoints ====="
log "Testing API test endpoint:"
curl -s http://localhost:3000/test | tee -a $LOG_FILE
log ""
log "Testing weather API endpoint:"
WEATHER_START=$(date +%s.%N)
WEATHER_RESPONSE=$(curl -s http://localhost:3000/weather?lat=24.7136&lon=46.6753 | grep -c "temperature" || echo "0")
WEATHER_END=$(date +%s.%N)
WEATHER_TIME=$(echo "$WEATHER_END - $WEATHER_START" | bc)

if [ "$WEATHER_RESPONSE" -gt 0 ]; then
  log "✅ Weather API is working"
else
  log "❌ Weather API is NOT working"
fi
log "API response time: ${WEATHER_TIME}s"
log ""

# Check website URLs
log "===== Website URLs ====="
check_url() {
  local url=$1
  local status=$(curl -s -o /dev/null -w "%{http_code}" $url)
  local result="❌ Status: $status (Failed)"
  
  if [[ $status == 200 || $status == 301 || $status == 302 ]]; then
    result="✅ Status: $status (OK)"
  fi
  
  log "Testing $url..."
  log "$result"
}

check_url "http://localhost/"
check_url "http://localhost/pa/"
check_url "http://localhost/pa/evapotran/"
check_url "https://flaha.org/"
check_url "https://flaha.org/pa/evapotran/"
log ""

# Check Nginx configuration
log "===== Nginx Configuration ====="
if [ -f "/etc/nginx/sites-available/flahacalc" ]; then
  log "✅ Nginx configuration file exists"
  
  if grep -q "location /pa/evapotran" /etc/nginx/sites-available/flahacalc; then
    log "✅ EVAPOTRAN location is configured"
  else
    log "❌ EVAPOTRAN location is NOT configured"
  fi
  
  if grep -q "location /api" /etc/nginx/sites-available/flahacalc; then
    log "✅ API proxy is configured"
  else
    log "❌ API proxy is NOT configured"
  fi
else
  log "❌ Nginx configuration file does NOT exist"
fi
log ""

# Check logs
log "===== Recent Nginx Access Logs ====="
tail -n 20 /var/log/nginx/access.log | tee -a $LOG_FILE
log ""

log "===== Recent Nginx Error Logs ====="
tail -n 20 /var/log/nginx/error.log | tee -a $LOG_FILE

# Count errors
ERROR_COUNT=$(grep -c "error" /var/log/nginx/error.log)
if [ $ERROR_COUNT -gt 100 ]; then
  log "[WARNING] High number of Nginx errors: $ERROR_COUNT"
fi
log ""

# Check application logs
log "===== Recent Application Logs ====="
pm2 logs --lines 20 | tee -a $LOG_FILE
log ""

# Analyze errors
log "===== Error Analysis ====="
log "404 errors in the last 100 requests:"
grep "\" 404 " /var/log/nginx/access.log | tail -n 10 | tee -a $LOG_FILE

NOT_FOUND_COUNT=$(grep -c "\" 404 " /var/log/nginx/access.log)
if [ $NOT_FOUND_COUNT -gt 100 ]; then
  log "[WARNING] High number of 404 errors: $NOT_FOUND_COUNT"
fi

log ""
log "500 errors in the last 100 requests:"
grep "\" 500 " /var/log/nginx/access.log | tail -n 10 | tee -a $LOG_FILE

SERVER_ERROR_COUNT=$(grep -c "\" 500 " /var/log/nginx/access.log)
if [ $SERVER_ERROR_COUNT -gt 0 ]; then
  log "[CRITICAL] Found $SERVER_ERROR_COUNT HTTP 500 errors"
fi
log ""

# Check response time
log "===== Server Response Time ====="
CURL_FORMAT="\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n"
curl -s -w "$CURL_FORMAT" -o /dev/null https://flaha.org/ | tee -a $LOG_FILE
log ""

# Security checks
log "===== Security Checks ====="
FAILED_LOGINS=$(grep -c "Failed password" /var/log/auth.log)
log "Failed login attempts: $FAILED_LOGINS"

WORLD_WRITABLE=$(find /var/www/flahacalc -type f -perm -o+w | wc -l)
log "World-writable files: $WORLD_WRITABLE"

NODE_VERSION=$(node -v)
log "Node.js version: $NODE_VERSION"
log ""

# Summary
log "Monitoring completed at $(date)"
log ""

# Count issues
CRITICAL_ISSUES=$(grep -c "\[CRITICAL\]" $LOG_FILE)
WARNING_ISSUES=$(grep -c "\[WARNING\]" $LOG_FILE)

log "===== Issue Summary ====="
log "Critical issues: $CRITICAL_ISSUES"
log "Warning issues: $WARNING_ISSUES"
log "Review the log file for details: $LOG_FILE"

# Exit with error if critical issues found
if [ $CRITICAL_ISSUES -gt 0 ]; then
  exit 1
fi

exit 0

