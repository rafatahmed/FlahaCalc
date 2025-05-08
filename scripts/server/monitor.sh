#!/bin/bash

# Exit on error
set -e

echo "Monitoring server health..."

# 1. Check system resources
echo "System resources:"
echo "----------------"
echo "CPU usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'

echo "Memory usage:"
free -m | awk 'NR==2{printf "%.2f%%\n", $3*100/$2}'

echo "Disk usage:"
df -h | grep '/dev/vda1'

# 2. Check Node.js server status
echo "Node.js server status:"
echo "---------------------"
pm2 status flahacalc-server

# 3. Check Nginx status
echo "Nginx status:"
echo "------------"
systemctl status nginx | grep Active

# 4. Check recent logs
echo "Recent server logs:"
echo "-----------------"
tail -n 20 /var/www/flahacalc/EVAPOTRAN/server/access.log

echo "Recent error logs:"
echo "----------------"
tail -n 20 /var/log/nginx/error.log

# 5. Check server response time
echo "Server response time:"
echo "------------------"
curl -s -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null https://flaha.org

echo "Server monitoring completed!"



