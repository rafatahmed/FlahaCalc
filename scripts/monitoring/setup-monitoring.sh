#!/bin/bash

# Add monitoring script to crontab
(crontab -l 2>/dev/null; echo "0 */6 * * * /var/www/flahacalc/scripts/monitoring/check-docs.sh") | crontab -