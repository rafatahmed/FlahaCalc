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
echo "===== Recent Nginx Error Logs ====="
tail -n 20 /var/log/nginx/error.log

echo ""
echo "===== Recent Application Logs ====="
pm2 logs flahacalc-server --lines 20 --nostream

echo ""
echo "===== API Endpoint Test ====="
curl -s http://localhost:3000/test

echo ""
echo "===== File Permissions ====="
ls -la /var/www/flahacalc/EVAPOTRAN/

echo ""
echo "===== SSL Certificate Status ====="
echo "Certificate expiration:"
openssl x509 -enddate -noout -in /etc/letsencrypt/live/flaha.org/fullchain.pem 2>/dev/null || echo "Certificate not found"

echo ""
echo "===== Network Connections ====="
apt install -y net-tools > /dev/null 2>&1
netstat -tulpn | grep 3000

