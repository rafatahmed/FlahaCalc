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

# Function to check URL status
check_url() {
  local url=$1
  local name=${2:-$url}
  echo "Testing $name..."
  
  HTTP_CODE=$(curl -s --connect-timeout 3 -m 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ Status: $HTTP_CODE (OK)"
  else
    echo "❌ Status: $HTTP_CODE (Error)"
    log_issue "CRITICAL" "URL $name returned HTTP $HTTP_CODE"
  fi
  
  # Check response time for important URLs
  if [[ "$url" == *"flaha.org"* ]]; then
    RESP_TIME=$(curl -s --connect-timeout 3 -m 10 -w "%{time_total}" -o /dev/null "$url" 2>/dev/null)
    if [ ! -z "$RESP_TIME" ] && (( $(echo "$RESP_TIME > 2.0" | bc -l 2>/dev/null) )); then
      log_issue "WARNING" "Slow response time for $name: ${RESP_TIME}s"
    fi
  fi
}

# Function to check log file for errors
check_log_file() {
  local log_file=$1
  local name=$2
  local error_pattern=${3:-"error"}
  local threshold=${4:-100}
  
  if [ -f "$log_file" ]; then
    echo "Checking $name log file..."
    tail -n 20 "$log_file"
    
    # Count errors
    ERROR_COUNT=$(grep -c -i "$error_pattern" "$log_file" 2>/dev/null || echo "0")
    if [ -n "$ERROR_COUNT" ] && [ "$ERROR_COUNT" -gt "$threshold" ]; then
      log_issue "WARNING" "High number of errors in $name log: ${ERROR_COUNT}"
    fi
  else
    echo "$name log file not found"
  fi
}

# Function to check HTTP error codes in access logs
check_http_errors() {
  local log_file=$1
  local name=$2
  local error_code=$3
  local threshold=${4:-0}
  
  if [ -f "$log_file" ]; then
    echo "$error_code errors in the last 100 $name requests:"
    HTTP_ERROR_COUNT=$(grep -c "\" $error_code " "$log_file" 2>/dev/null || echo "0")
    grep "\" $error_code " "$log_file" 2>/dev/null | tail -n 10
    
    if [ -n "$HTTP_ERROR_COUNT" ] && [ "$HTTP_ERROR_COUNT" -gt "$threshold" ]; then
      if [ "$error_code" = "500" ]; then
        log_issue "CRITICAL" "Found $HTTP_ERROR_COUNT HTTP $error_code errors in $name"
      else
        log_issue "WARNING" "High number of HTTP $error_code errors in $name: ${HTTP_ERROR_COUNT}"
      fi
    fi
  else
    echo "$name access log file not found"
  fi
}

# Start monitoring
echo "===== FlahaCalc Monitoring Script ====="
echo "Date: $(date)"
echo "Log file: $LOG_FILE"
echo ""

# System resources
echo "===== System Resources ====="
echo "CPU usage:"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' 2>/dev/null || echo "N/A")
echo "$CPU_USAGE%"

echo "Memory usage:"
free -h

echo "Disk usage:"
df -h /var/www/flahacalc

# PM2 Status
echo ""
echo "===== PM2 Status ====="
if command -v pm2 &> /dev/null; then
  pm2 status
else
  echo "PM2 is not installed"
fi

# Nginx Status
echo ""
echo "===== Nginx Status ====="
if command -v systemctl &> /dev/null; then
  systemctl status nginx | grep Active
else
  echo "systemctl not available"
fi

# Check logs
echo ""
echo "===== Recent Nginx Access Logs ====="
check_log_file "/var/log/nginx/access.log" "Nginx access"
check_log_file "/var/log/nginx/evapotran.flaha.org-access.log" "Subdomain access"

echo ""
echo "===== Recent Nginx Error Logs ====="
check_log_file "/var/log/nginx/error.log" "Nginx error"
check_log_file "/var/log/nginx/evapotran.flaha.org-error.log" "Subdomain error"

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
check_http_errors "/var/log/nginx/access.log" "main site" "404" 20
check_http_errors "/var/log/nginx/evapotran.flaha.org-access.log" "subdomain" "404" 20
check_http_errors "/var/log/nginx/access.log" "main site" "500" 0
check_http_errors "/var/log/nginx/evapotran.flaha.org-access.log" "subdomain" "500" 0

# Check for slow requests
if [ -f "/var/log/nginx/access.log" ]; then
  SLOW_REQUESTS=$(grep -c "request time: [1-9][0-9]*\.[0-9]*" /var/log/nginx/access.log 2>/dev/null || echo "0")
  if [ -n "$SLOW_REQUESTS" ] && [ "$SLOW_REQUESTS" -gt 10 ]; then
    log_issue "WARNING" "High number of slow requests: ${SLOW_REQUESTS}"
  fi
fi

if [ -f "/var/log/nginx/evapotran.flaha.org-access.log" ]; then
  SUBDOMAIN_SLOW_REQUESTS=$(grep -c "request time: [1-9][0-9]*\.[0-9]*" /var/log/nginx/evapotran.flaha.org-access.log 2>/dev/null || echo "0")
  if [ -n "$SUBDOMAIN_SLOW_REQUESTS" ] && [ "$SUBDOMAIN_SLOW_REQUESTS" -gt 10 ]; then
    log_issue "WARNING" "High number of slow subdomain requests: ${SUBDOMAIN_SLOW_REQUESTS}"
  fi
fi

# Check server response time
echo ""
echo "===== Server Response Time ====="
RESP_TIME=$(curl -s --connect-timeout 3 -m 10 -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null https://flaha.org/ 2>/dev/null)
echo "$RESP_TIME"

TOTAL_TIME=$(echo "$RESP_TIME" | grep "Total:" | awk '{print $2}' | sed 's/s//' 2>/dev/null)
if [ -n "$TOTAL_TIME" ] && (( $(echo "$TOTAL_TIME > 2.0" | bc -l 2>/dev/null) )); then
  log_issue "WARNING" "Slow server response time: ${TOTAL_TIME}s"
fi

# Check subdomain response time
echo ""
echo "===== Subdomain Response Time ====="
SUBDOMAIN_RESP_TIME=$(curl -s --connect-timeout 3 -m 10 -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null https://evapotran.flaha.org/ 2>/dev/null)
echo "$SUBDOMAIN_RESP_TIME"

SUBDOMAIN_TOTAL_TIME=$(echo "$SUBDOMAIN_RESP_TIME" | grep "Total:" | awk '{print $2}' | sed 's/s//' 2>/dev/null)
if [ -n "$SUBDOMAIN_TOTAL_TIME" ] && (( $(echo "$SUBDOMAIN_TOTAL_TIME > 2.0" | bc -l 2>/dev/null) )); then
  log_issue "WARNING" "Slow subdomain response time: ${SUBDOMAIN_TOTAL_TIME}s"
fi

# Check for security issues
echo ""
echo "===== Security Checks ====="
if [ -f "/var/log/auth.log" ]; then
    FAILED_LOGIN_COUNT=$(grep -c "Failed password" /var/log/auth.log 2>/dev/null || echo "0")
    echo "Failed login attempts: $FAILED_LOGIN_COUNT"
    
    if [ -n "$FAILED_LOGIN_COUNT" ] && [ "$FAILED_LOGIN_COUNT" -gt 10 ]; then
        log_issue "WARNING" "High number of failed login attempts: ${FAILED_LOGIN_COUNT}"
        TOP_IPS=$(grep "Failed password" /var/log/auth.log 2>/dev/null | grep -oE "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b" | sort | uniq -c | sort -nr | head -5)
        echo "Top IPs with failed logins:"
        echo "$TOP_IPS"
    fi
fi

# Check for file permission issues
if [ -d "/var/www/flahacalc" ]; then
    WRONG_PERMS=$(find /var/www/flahacalc -type f -perm /o=w 2>/dev/null | wc -l)
    echo "World-writable files: $WRONG_PERMS"
    
    if [ -n "$WRONG_PERMS" ] && [ "$WRONG_PERMS" -gt 0 ]; then
        log_issue "WARNING" "Found $WRONG_PERMS files with world-writable permissions"
    fi
fi

# Check Node.js version if available
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "Node.js version: $NODE_VERSION"
    
    VERSION_NUM=$(echo "$NODE_VERSION" | cut -d 'v' -f 2)
    if [ -n "$VERSION_NUM" ] && (( $(echo "$VERSION_NUM < 14.0" | bc -l 2>/dev/null) )); then
        log_issue "WARNING" "Node.js version $NODE_VERSION is outdated"
    fi
fi

# Check API endpoints
echo ""
echo "===== API Endpoints ====="
API_TEST=$(curl -s --connect-timeout 3 -m 5 "http://localhost:3000/api/test" 2>/dev/null)
if [[ "$API_TEST" == *"status"*"ok"* ]]; then
    echo "✅ API test endpoint is working"
else
    echo "❌ API test endpoint is not working"
    log_issue "CRITICAL" "API test endpoint is not working"
fi

WEATHER_API=$(curl -s --connect-timeout 3 -m 5 "http://localhost:3000/api/weather?q=London" 2>/dev/null)
if [[ "$WEATHER_API" == *"name"*"London"* ]]; then
    echo "✅ Weather API endpoint is working"
else
    echo "❌ Weather API endpoint is not working"
    log_issue "CRITICAL" "Weather API endpoint is not working"
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

if [ -n "$CRITICAL_COUNT" ] && [ "$CRITICAL_COUNT" -gt 0 ] || [ -n "$WARNING_COUNT" ] && [ "$WARNING_COUNT" -gt 0 ]; then
    echo "Review the log file for details: $LOG_FILE"
fi



