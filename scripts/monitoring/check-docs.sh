#!/bin/bash

# Script to check if the documentation site is accessible

DOCS_URL="https://evapotran-docs.flaha.org"
LOG_FILE="/var/log/flahacalc/docs-monitoring.log"

# Create log directory if it doesn't exist
mkdir -p $(dirname $LOG_FILE)

echo "$(date): Checking documentation site availability..." >> $LOG_FILE

# Check if the site is accessible
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOCS_URL)

if [ $HTTP_STATUS -eq 200 ]; then
    echo "$(date): Documentation site is UP (HTTP $HTTP_STATUS)" >> $LOG_FILE
else
    echo "$(date): WARNING - Documentation site returned HTTP $HTTP_STATUS" >> $LOG_FILE
    
    # Send notification email
    echo "Documentation site at $DOCS_URL is returning HTTP $HTTP_STATUS" | \
    mail -s "ALERT: Documentation Site Issue" admin@flaha.org
fi
