#!/bin/bash

# Exit on error
set -e

echo "Syncing changes from server to local repository..."

# Check if we have SSH access to the server
ssh -q root@207.154.202.6 exit
if [ $? -ne 0 ]; then
    echo "Cannot connect to the server. Please check your SSH configuration."
    exit 1
fi

# Create a temporary directory
temp_dir=$(mktemp -d)
echo "Created temporary directory: $temp_dir"

# Clone the repository from the server
echo "Cloning repository from server..."
ssh root@207.154.202.6 "cd /var/www/flahacalc && git add . && git commit -m 'Server changes before sync' || true"
ssh root@207.154.202.6 "cd /var/www/flahacalc && git bundle create /tmp/flahacalc.bundle --all"
scp root@207.154.202.6:/tmp/flahacalc.bundle $temp_dir/
ssh root@207.154.202.6 "rm /tmp/flahacalc.bundle"

# Extract the bundle
echo "Extracting bundle..."
cd $temp_dir
git clone flahacalc.bundle flahacalc
cd flahacalc

# Create a branch for the server changes
echo "Creating branch for server changes..."
git checkout -b server-sync-$(date +%Y%m%d-%H%M%S)

# Copy the changes to the local repository
echo "Copying changes to local repository..."
rsync -av --exclude '.git' --exclude 'node_modules' ./ $(git -C $(pwd) rev-parse --show-toplevel)/

echo "Changes synced successfully!"
echo "You can now review the changes, commit them, and push to GitHub."