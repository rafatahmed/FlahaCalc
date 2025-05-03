#!/bin/bash

# Usage: ./alert.sh "Alert message"

WEBHOOK_URL="your_slack_webhook_url"
MESSAGE="$1"
HOSTNAME=$(hostname)

curl -X POST -H 'Content-type: application/json' \
--data "{\"text\":\"🚨 *SERVER ALERT* 🚨\n*Server:* ${HOSTNAME}\n*Message:* ${MESSAGE}\n*Time:* $(date)\"}" \
$WEBHOOK_URL