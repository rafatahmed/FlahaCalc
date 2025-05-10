#!/bin/bash

# Create log directory and file
LOG_DIR="/var/log/flahacalc"
LOG_FILE="$LOG_DIR/monitor-$(date +%Y%m%d).log"
mkdir -p "$LOG_DIR" 2>/dev/null

# Function to log issues with severity
log_issue() {
  local severity=$1
  local message=$2
  echo "[$severity] $message" | tee -a "$LOG_FILE"
}

echo "===== FlahaCalc Comprehensive Monitoring ====="
echo "Date: $(date)"
echo "Log file: $LOG_FILE"
echo ""

# System resources
echo "===== System Resources ====="
echo "CPU usage:"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
echo "$CPU_USAGE%"
if (( $(echo "$CPU_USAGE > 90" | bc -l 2>/dev/null) )); then
  log_issue "CRITICAL" "CPU usage is very high: $CPU_USAGE%"
elif (( $(echo "$CPU_USAGE > 75" | bc -l 2>/dev/null) )); then
  log_issue "WARNING" "CPU usage is high: $CPU_USAGE%"
fi

echo "Memory usage:"
free -h
MEM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
if (( $(echo "$MEM_USAGE > 90" | bc -l 2>/dev/null) )); then
  log_issue "CRITICAL" "Memory usage is very high: $MEM_USAGE%"
elif (( $(echo "$MEM_USAGE > 80" | bc -l 2>/dev/null) )); then
  log_issue "WARNING" "Memory usage is high: $MEM_USAGE%"
fi

echo "Disk usage:"
df -h /var/www/flahacalc
DISK_USAGE=$(df -h /var/www/flahacalc | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
  log_issue "CRITICAL" "Disk usage is very high: $DISK_USAGE%"
elif [ "$DISK_USAGE" -gt 80 ]; then
  log_issue "WARNING" "Disk usage is high: $DISK_USAGE%"
fi

# Check for disk I/O issues if iostat is available
if command -v iostat &> /dev/null; then
  echo ""
  echo "Disk I/O:"
  DISK_IO=$(iostat -x | grep -v "^$" | grep -A1 "avg-cpu" | tail -1)
  echo "$DISK_IO"
  DISK_UTIL=$(echo "$DISK_IO" | awk '{print $NF}')
  if (( $(echo "$DISK_UTIL > 80" | bc -l 2>/dev/null) )); then
    log_issue "WARNING" "High disk utilization: $DISK_UTIL%"
  fi
fi

# PM2 Status
echo ""
echo "===== PM2 Status ====="
if command -v pm2 &> /dev/null; then
  pm2 status
  # Check if flahacalc-server is running
  if ! pm2 list | grep -q "flahacalc-server"; then
    log_issue "CRITICAL" "flahacalc-server process is not running"
  elif pm2 list | grep "flahacalc-server" | grep -q "errored\|stopped"; then
    log_issue "CRITICAL" "flahacalc-server process is in error state"
  fi
  
  # Check PM2 memory usage
  PM2_MEM=$(pm2 jlist 2>/dev/null | grep -o '"memory":[0-9]*' | grep -o '[0-9]*' | sort -nr | head -1)
  if [ ! -z "$PM2_MEM" ] && [ "$PM2_MEM" -gt 500000000 ]; then
    log_issue "WARNING" "High memory usage in PM2 process: $(($PM2_MEM/1000000))MB"
  fi
else
  echo "PM2 is not installed"
  log_issue "CRITICAL" "PM2 is not installed"
fi

# Nginx Status
echo ""
echo "===== Nginx Status ====="
if command -v systemctl &> /dev/null; then
  NGINX_STATUS=$(systemctl status nginx | grep Active)
  echo "$NGINX_STATUS"
  if ! systemctl is-active --quiet nginx; then
    log_issue "CRITICAL" "Nginx service is not running"
  fi
else
  echo "systemctl not available"
  log_issue "WARNING" "Cannot check Nginx status (systemctl not available)"
fi

# Check Nginx worker connections if status page is available
NGINX_CONN=$(curl -s --connect-timeout 3 http://localhost/nginx_status 2>/dev/null | grep "Active connections" | awk '{print $3}')
if [ ! -z "$NGINX_CONN" ]; then
  echo "Active connections: $NGINX_CONN"
  if [ "$NGINX_CONN" -gt 1000 ]; then
    log_issue "WARNING" "High number of active Nginx connections: $NGINX_CONN"
  fi
fi

# Check SSL certificate
echo ""
echo "===== SSL Certificate Status ====="
DOMAINS=("flaha.org" "evapotran.flaha.org")
for DOMAIN in "${DOMAINS[@]}"; do
  echo "Checking SSL for $DOMAIN:"
  if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
      EXPIRY_DATE=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
      EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
      CURRENT_EPOCH=$(date +%s)
      DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
      echo "SSL certificate expires in $DAYS_LEFT days"
      
      if [ "$DAYS_LEFT" -lt 7 ]; then
          log_issue "CRITICAL" "SSL certificate for $DOMAIN expires in $DAYS_LEFT days"
      elif [ "$DAYS_LEFT" -lt 14 ]; then
          log_issue "WARNING" "SSL certificate for $DOMAIN expires in $DAYS_LEFT days"
      fi
      
      # Check SSL cipher strength
      if openssl ciphers -v 'LOW:MEDIUM' &>/dev/null; then
          WEAK_CIPHER=$(openssl ciphers -v 'LOW:MEDIUM' 2>/dev/null | wc -l)
          if [ "$WEAK_CIPHER" -gt 0 ]; then
              log_issue "WARNING" "Weak SSL ciphers are enabled for $DOMAIN"
          fi
      fi
  else
      echo "SSL certificate not found for $DOMAIN"
      log_issue "CRITICAL" "SSL certificate not found for $DOMAIN"
  fi
done

# Check API endpoints
echo ""
echo "===== API Endpoints ====="
echo "Testing API test endpoint:"
API_RESPONSE=$(curl -s --connect-timeout 3 -m 5 http://localhost:3000/api/test)
echo "$API_RESPONSE"
if [[ "$API_RESPONSE" != *"status"*"ok"* ]]; then
    log_issue "CRITICAL" "API test endpoint is not working"
fi

# Test API through subdomain
echo "Testing API test endpoint through subdomain:"
SUBDOMAIN_API_RESPONSE=$(curl -s --connect-timeout 3 -m 5 https://evapotran.flaha.org/api/test)
echo "$SUBDOMAIN_API_RESPONSE"
if [[ "$SUBDOMAIN_API_RESPONSE" != *"status"*"ok"* ]]; then
    log_issue "CRITICAL" "API test endpoint through subdomain is not working"
fi

echo ""
echo "Testing weather API endpoint:"
WEATHER_RESPONSE=$(curl -s --connect-timeout 3 -m 5 http://localhost:3000/api/weather?q=London)
if [[ "$WEATHER_RESPONSE" == *"Invalid API key"* ]]; then
    echo "⚠️ Weather API needs a valid API key"
    log_issue "WARNING" "Weather API needs a valid API key"
elif [[ "$WEATHER_RESPONSE" == *"name"*"London"* ]]; then
    echo "✅ Weather API is working"
else
    echo "❌ Weather API is not working"
    echo "Response: $WEATHER_RESPONSE"
    log_issue "CRITICAL" "Weather API is not working"
fi

# Test weather API through subdomain
echo "Testing weather API endpoint through subdomain:"
SUBDOMAIN_WEATHER_RESPONSE=$(curl -s --connect-timeout 3 -m 5 https://evapotran.flaha.org/api/weather?q=London)
if [[ "$SUBDOMAIN_WEATHER_RESPONSE" == *"Invalid API key"* ]]; then
    echo "⚠️ Weather API through subdomain needs a valid API key"
    log_issue "WARNING" "Weather API through subdomain needs a valid API key"
elif [[ "$SUBDOMAIN_WEATHER_RESPONSE" == *"name"*"London"* ]]; then
    echo "✅ Weather API through subdomain is working"
else
    echo "❌ Weather API through subdomain is not working"
    echo "Response: $SUBDOMAIN_WEATHER_RESPONSE"
    log_issue "CRITICAL" "Weather API through subdomain is not working"
fi

# Check API response time
API_RESPONSE_TIME=$(curl -s --connect-timeout 3 -w "%{time_total}" -o /dev/null http://localhost:3000/api/test 2>/dev/null)
if [ ! -z "$API_RESPONSE_TIME" ]; then
  echo "API response time: ${API_RESPONSE_TIME}s"
  if (( $(echo "$API_RESPONSE_TIME > 1.0" | bc -l 2>/dev/null) )); then
    log_issue "WARNING" "Slow API response time: ${API_RESPONSE_TIME}s"
  fi
fi

# Check API response time through subdomain
SUBDOMAIN_API_RESPONSE_TIME=$(curl -s --connect-timeout 3 -w "%{time_total}" -o /dev/null https://evapotran.flaha.org/api/test 2>/dev/null)
if [ ! -z "$SUBDOMAIN_API_RESPONSE_TIME" ]; then
  echo "API response time through subdomain: ${SUBDOMAIN_API_RESPONSE_TIME}s"
  if (( $(echo "$SUBDOMAIN_API_RESPONSE_TIME > 1.0" | bc -l 2>/dev/null) )); then
    log_issue "WARNING" "Slow API response time through subdomain: ${SUBDOMAIN_API_RESPONSE_TIME}s"
  fi
fi

# Check website URLs
echo ""
echo "===== Website URLs ====="
URLS=(
  "http://localhost/"
  "http://localhost/pa/"
  "http://localhost/pa/evapotran/"
  "https://flaha.org/"
  "https://flaha.org/pa/evapotran/"
  "https://evapotran.flaha.org/"
  "https://evapotran.flaha.org/calculator.html"
  "https://evapotran.flaha.org/live-weather.html"
)

for url in "${URLS[@]}"; do
  echo "Testing $url..."
  HTTP_CODE=$(curl -s --connect-timeout 3 -m 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ Status: $HTTP_CODE (OK)"
  else
    echo "❌ Status: $HTTP_CODE (Error)"
    log_issue "CRITICAL" "URL $url returned HTTP $HTTP_CODE"
  fi
  
  # Check response time for important URLs
  if [[ "$url" == *"flaha.org"* ]]; then
    RESP_TIME=$(curl -s --connect-timeout 3 -m 10 -w "%{time_total}" -o /dev/null "$url" 2>/dev/null)
    if [ ! -z "$RESP_TIME" ] && (( $(echo "$RESP_TIME > 2.0" | bc -l 2>/dev/null) )); then
      log_issue "WARNING" "Slow response time for $url: ${RESP_TIME}s"
    fi
  fi
done

# Check JavaScript resources
echo ""
echo "===== JavaScript Resources ====="
JS_FILES=(
  "https://evapotran.flaha.org/js/script.js"
  "https://evapotran.flaha.org/js/live-weather.js"
  "https://evapotran.flaha.org/js/calculation-worker.js"
)

for js_url in "${JS_FILES[@]}"; do
  echo "Testing $js_url..."
  JS_HTTP_CODE=$(curl -s --connect-timeout 3 -m 10 -o /dev/null -w "%{http_code}" "$js_url" 2>/dev/null)
  if [ "$JS_HTTP_CODE" = "200" ]; then
    echo "✅ Status: $JS_HTTP_CODE (OK)"
  else
    echo "❌ Status: $JS_HTTP_CODE (Error)"
    log_issue "CRITICAL" "JavaScript resource $js_url returned HTTP $JS_HTTP_CODE"
  fi
done

# Check Nginx configuration
echo ""
echo "===== Nginx Configuration ====="
if [ -f "/etc/nginx/sites-enabled/flahacalc" ]; then
    echo "✅ Nginx configuration file exists"
    if grep -q "location /pa/evapotran/" "/etc/nginx/sites-enabled/flahacalc"; then
        echo "✅ EVAPOTRAN location is configured"
    else
        echo "❌ EVAPOTRAN location is missing"
        log_issue "CRITICAL" "EVAPOTRAN location is missing in Nginx config"
    fi
    
    if grep -q "location /api/" "/etc/nginx/sites-enabled/flahacalc"; then
        echo "✅ API proxy is configured"
    else
        echo "❌ API proxy is missing"
        log_issue "CRITICAL" "API proxy is missing in Nginx config"
    fi
    
    # Check for proper SSL configuration
    if ! grep -q "ssl_protocols TLSv1.2 TLSv1.3" "/etc/nginx/sites-enabled/flahacalc"; then
        log_issue "WARNING" "Nginx may be using outdated SSL protocols"
    fi
    
    # Check for proper HSTS configuration
    if ! grep -q "Strict-Transport-Security" "/etc/nginx/sites-enabled/flahacalc"; then
        log_issue "WARNING" "HSTS header is missing in Nginx config"
    fi
else
    echo "❌ Nginx configuration file is missing"
    log_issue "CRITICAL" "Nginx configuration file is missing"
fi

# Check subdomain configuration
if [ -f "/etc/nginx/sites-enabled/evapotran.flaha.org" ]; then
    echo "✅ Subdomain Nginx configuration file exists"
    if grep -q "server_name evapotran.flaha.org" "/etc/nginx/sites-enabled/evapotran.flaha.org"; then
        echo "✅ Subdomain server_name is configured"
    else
        echo "❌ Subdomain server_name is missing"
        log_issue "CRITICAL" "Subdomain server_name is missing in Nginx config"
    fi
    
    if grep -q "location /api/" "/etc/nginx/sites-enabled/evapotran.flaha.org"; then
        echo "✅ Subdomain API proxy is configured"
    else
        echo "❌ Subdomain API proxy is missing"
        log_issue "CRITICAL" "Subdomain API proxy is missing in Nginx config"
    fi
else
    echo "❌ Subdomain Nginx configuration file is missing"
    log_issue "CRITICAL" "Subdomain Nginx configuration file is missing"
fi

# Check logs
echo ""
echo "===== Recent Nginx Access Logs ====="
if [ -f "/var/log/nginx/access.log" ]; then
    tail -n 20 /var/log/nginx/access.log
else
    echo "Access log file not found"
    log_issue "WARNING" "Nginx access log file not found"
fi

# Check subdomain access logs
if [ -f "/var/log/nginx/evapotran.flaha.org-access.log" ]; then
    echo ""
    echo "===== Recent Subdomain Access Logs ====="
    tail -n 20 /var/log/nginx/evapotran.flaha.org-access.log
else
    echo "Subdomain access log file not found"
    log_issue "WARNING" "Subdomain access log file not found"
fi

echo ""
echo "===== Recent Nginx Error Logs ====="
if [ -f "/var/log/nginx/error.log" ]; then
    tail -n 20 /var/log/nginx/error.log
    
    # Count errors
    ERROR_COUNT=$(grep -c "error" /var/log/nginx/error.log)
    if [ "$ERROR_COUNT" -gt 100 ]; then
        log_issue "WARNING" "High number of Nginx errors: ${ERROR_COUNT}"
    fi
else
    echo "Error log file not found"
    log_issue "WARNING" "Nginx error log file not found"
fi

# Check subdomain error logs
if [ -f "/var/log/nginx/evapotran.flaha.org-error.log" ]; then
    echo ""
    echo "===== Recent Subdomain Error Logs ====="
    tail -n 20 /var/log/nginx/evapotran.flaha.org-error.log
    
    # Count errors
    SUBDOMAIN_ERROR_COUNT=$(grep -c "error" /var/log/nginx/evapotran.flaha.org-error.log)
    if [ "$SUBDOMAIN_ERROR_COUNT" -gt 100 ]; then
        log_issue "WARNING" "High number of subdomain Nginx errors: ${SUBDOMAIN_ERROR_COUNT}"
    fi
else
    echo "Subdomain error log file not found"
    log_issue "WARNING" "Subdomain error log file not found"
fi

echo ""
echo "===== Recent Application Logs ====="
if command -v pm2 &> /dev/null; then
    pm2 logs flahacalc-server --lines 20 --nostream
else
    echo "PM2 is not installed"
fi

# Check for errors
echo ""
echo "===== Error Analysis ====="
echo "404 errors in the last 100 requests:"
if [ -f "/var/log/nginx/access.log" ]; then
    HTTP_404_COUNT=$(grep -c "\" 404 " /var/log/nginx/access.log)
    grep "\" 404 " /var/log/nginx/access.log | tail -n 10
    
    if [ "$HTTP_404_COUNT" -gt 20 ]; then
        log_issue "WARNING" "High number of 404 errors: ${HTTP_404_COUNT}"
    fi
else
    echo "Access log file not found"
fi

# Check subdomain 404 errors
if [ -f "/var/log/nginx/evapotran.flaha.org-access.log" ]; then
    echo ""
    echo "404 errors in the last 100 subdomain requests:"
    SUBDOMAIN_HTTP_404_COUNT=$(grep -c "\" 404 " /var/log/nginx/evapotran.flaha.org-access.log)
    grep "\" 404 " /var/log/nginx/evapotran.flaha.org-access.log | tail -n 10
    
    if [ "$SUBDOMAIN_HTTP_404_COUNT" -gt 20 ]; then
        log_issue "WARNING" "High number of subdomain 404 errors: ${SUBDOMAIN_HTTP_404_COUNT}"
    fi
else
    echo "Subdomain access log file not found"
fi

echo ""
echo "500 errors in the last 100 requests:"
if [ -f "/var/log/nginx/access.log" ]; then
    HTTP_500_COUNT=$(grep -c "\" 500 " /var/log/nginx/access.log)
    grep "\" 500 " /var/log/nginx/access.log | tail -n 10
    
    if [ "$HTTP_500_COUNT" -gt 0 ]; then
        log_issue "CRITICAL" "Found $HTTP_500_COUNT HTTP 500 errors"
    fi
else
    echo "Access log file not found"
fi

# Check subdomain 500 errors
if [ -f "/var/log/nginx/evapotran.flaha.org-access.log" ]; then
    echo ""
    echo "500 errors in the last 100 subdomain requests:"
    SUBDOMAIN_HTTP_500_COUNT=$(grep -c "\" 500 " /var/log/nginx/evapotran.flaha.org-access.log)
    grep "\" 500 " /var/log/nginx/evapotran.flaha.org-access.log | tail -n 10
    
    if [ "$SUBDOMAIN_HTTP_500_COUNT" -gt 0 ]; then
        log_issue "CRITICAL" "Found $SUBDOMAIN_HTTP_500_COUNT HTTP 500 errors in subdomain"
    fi
else
    echo "Subdomain access log file not found"
fi

# Check for slow requests if custom log format is used
if [ -f "/var/log/nginx/access.log" ]; then
    SLOW_REQUESTS=$(grep -c "request time: [1-9][0-9]*\.[0-9]*" /var/log/nginx/access.log 2>/dev/null || echo "0")
    if [ "$SLOW_REQUESTS" -gt 10 ]; then
        log_issue "WARNING" "High number of slow requests: ${SLOW_REQUESTS}"
    fi
fi

# Check for slow subdomain requests
if [ -f "/var/log/nginx/evapotran.flaha.org-access.log" ]; then
    SUBDOMAIN_SLOW_REQUESTS=$(grep -c "request time: [1-9][0-9]*\.[0-9]*" /var/log/nginx/evapotran.flaha.org-access.log 2>/dev/null || echo "0")
    if [ "$SUBDOMAIN_SLOW_REQUESTS" -gt 10 ]; then
        log_issue "WARNING" "High number of slow subdomain requests: ${SUBDOMAIN_SLOW_REQUESTS}"
    fi
fi

echo ""
echo "===== Server Response Time ====="
RESP_TIME=$(curl -s --connect-timeout 3 -m 10 -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null https://flaha.org/ 2>/dev/null)
echo "$RESP_TIME"

TOTAL_TIME=$(echo "$RESP_TIME" | grep "Total:" | awk '{print $2}' | sed 's/s//')
if [ ! -z "$TOTAL_TIME" ] && (( $(echo "$TOTAL_TIME > 2.0" | bc -l 2>/dev/null) )); then
    log_issue "WARNING" "Slow server response time: ${TOTAL_TIME}s"
fi

# Check subdomain response time
echo ""
echo "===== Subdomain Response Time ====="
SUBDOMAIN_RESP_TIME=$(curl -s --connect-timeout 3 -m 10 -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null https://evapotran.flaha.org/ 2>/dev/null)
echo "$SUBDOMAIN_RESP_TIME"

SUBDOMAIN_TOTAL_TIME=$(echo "$SUBDOMAIN_RESP_TIME" | grep "Total:" | awk '{print $2}' | sed 's/s//')
if [ ! -z "$SUBDOMAIN_TOTAL_TIME" ] && (( $(echo "$SUBDOMAIN_TOTAL_TIME > 2.0" | bc -l 2>/dev/null) )); then
    log_issue "WARNING" "Slow subdomain response time: ${SUBDOMAIN_TOTAL_TIME}s"
fi

# Check for security issues
echo ""
echo "===== Security Checks ====="
if [ -f "/var/log/auth.log" ]; then
    FAILED_LOGIN_COUNT=$(grep -c "Failed password" /var/log/auth.log)
    echo "Failed login attempts: $FAILED_LOGIN_COUNT"
    
    if [ "$FAILED_LOGIN_COUNT" -gt 10 ]; then
        log_issue "WARNING" "High number of failed login attempts: ${FAILED_LOGIN_COUNT}"
        TOP_IPS=$(grep "Failed password" /var/log/auth.log | grep -oE "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b" | sort | uniq -c | sort -nr | head -5)
        echo "Top IPs with failed logins:"
        echo "$TOP_IPS"
    fi
fi

# Check for file permission issues
if [ -d "/var/www/flahacalc" ]; then
    WRONG_PERMS=$(find /var/www/flahacalc -type f -perm /o=w 2>/dev/null | wc -l)
    echo "World-writable files: $WRONG_PERMS"
    
    if [ "$WRONG_PERMS" -gt 0 ]; then
        log_issue "WARNING" "Found $WRONG_PERMS files with world-writable permissions"
    fi
fi

# Check Node.js version if available
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "Node.js version: $NODE_VERSION"
    
    VERSION_NUM=$(echo "$NODE_VERSION" | cut -d 'v' -f 2)
    if [ ! -z "$VERSION_NUM" ] && (( $(echo "$VERSION_NUM < 14.0" | bc -l 2>/dev/null) )); then
        log_issue "WARNING" "Node.js version $NODE_VERSION is outdated"
    fi
fi

echo ""
echo "Monitoring completed at $(date)"

# Summary of issues
CRITICAL_COUNT=$(grep -c "\[CRITICAL\]" "$LOG_FILE" 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "\[WARNING\]" "$LOG_FILE" 2>/dev/null || echo "0")

echo ""
echo "===== Issue Summary ====="
echo "Critical issues: $CRITICAL_COUNT"
echo "Warning issues: $WARNING_COUNT"

if [ "$CRITICAL_COUNT" -gt 0 ] || [ "$WARNING_COUNT" -gt 0 ]; then
    echo "Review the log file for details: $LOG_FILE"
fi


