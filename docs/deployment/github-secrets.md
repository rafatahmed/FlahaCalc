# GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. `DROPLET_HOST`: Your DigitalOcean Droplet's IP address
2. `DROPLET_USERNAME`: The username for SSH access (usually 'root')
3. `DROPLET_SSH_KEY`: Your private SSH key for accessing the Droplet

To generate the SSH key content for GitHub:
```bash
cat ~/.ssh/id_rsa | base64
```

Then paste the output as the value for DROPLET_SSH_KEY.