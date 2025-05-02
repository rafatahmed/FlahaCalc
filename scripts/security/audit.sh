#!/bin/bash

# Exit on error
set -e

echo "Running security audit..."

# Check for npm vulnerabilities
echo "Checking npm packages for vulnerabilities..."
cd /var/www/flahacalc
npm audit

cd EVAPOTRAN/server
npm audit

# Check SSL configuration
echo "Checking SSL configuration..."
curl -s https://www.ssllabs.com/ssltest/analyze.html?d=flaha.org

# Check for open ports
echo "Checking open ports..."
nmap -p 1-1000 localhost

# Check fail2ban status
echo "Checking fail2ban status..."
fail2ban-client status

# Check firewall status
echo "Checking firewall status..."
ufw status

# Check for unauthorized SSH login attempts
echo "Checking for unauthorized SSH login attempts..."
grep "Failed password" /var/log/auth.log | tail -n 10

echo "Security audit completed!"
