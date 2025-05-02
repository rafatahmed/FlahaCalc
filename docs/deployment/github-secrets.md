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

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Add each of the required secrets:
   - Name: DROPLET_HOST
     Value: your-droplet-ip-address
   - Name: DROPLET_USERNAME
     Value: root (or your custom username)
   - Name: DROPLET_SSH_KEY
     Value: (base64 encoded private key)

## Setting Up SSH Access on the Droplet

1. On your local machine, generate an SSH key if you don't have one:
   ```bash
   ssh-keygen -t rsa -b 4096
   ```

2. Add your public key to the authorized_keys file on your Droplet:
   ```bash
   ssh-copy-id root@your-droplet-ip
   ```

3. Test the connection:
   ```bash
   ssh root@your-droplet-ip
   ```

4. Make sure Git is installed on your Droplet:
   ```bash
   apt update && apt install git -y
   ```

5. Set up Git credentials on your Droplet:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your-email@example.com"
   ```
