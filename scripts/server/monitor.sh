#!/bin/bash

echo "===== FlahaCalc Monitoring ====="
echo "Date: $(date)"
echo ""

echo "===== PM2 Status ====="
pm2 status

echo ""
echo "===== Server Memory Usage ====="
free -h

echo ""
echo "===== Disk Usage ====="
df -h /var/www/flahacalc

echo ""
echo "===== Recent Nginx Access Logs ====="
tail -n 20 /var/log/nginx/access.log

echo ""
echo "===== Recent Application Logs ====="
pm2 logs flahacalc-server --lines 20 --nostream
