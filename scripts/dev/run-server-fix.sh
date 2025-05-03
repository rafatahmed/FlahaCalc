#!/bin/bash

# Exit on error
set -e

echo "Running comprehensive fix on server..."

# Variables
SERVER_HOST="207.154.202.6"
SERVER_USER="root"

# Check if we have SSH access to the server
ssh -q $SERVER_USER@$SERVER_HOST exit
if [ $? -ne 0 ]; then
    echo "Cannot connect to the server. Please check your SSH configuration."
    exit 1
fi

# Copy the fix script to the server
echo "Copying fix script to server..."
scp scripts/server/comprehensive-fix.sh $SERVER_USER@$SERVER_HOST:/tmp/

# Make the script executable and run it
echo "Running fix script on server..."
ssh $SERVER_USER@$SERVER_HOST "chmod +x /tmp/comprehensive-fix.sh && /tmp/comprehensive-fix.sh"

echo "Fix script has been run on the server."
echo "Please test the live weather functionality again."