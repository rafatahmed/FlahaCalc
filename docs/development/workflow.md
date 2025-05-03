# FlahaCalc Development Workflow

This document outlines the recommended development workflow for the FlahaCalc project.

## Development Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rafatahmed/FlahaCalc.git
   cd FlahaCalc
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd EVAPOTRAN/server
   npm install
   cd ../..
   ```

3. **Set up environment variables**
   ```bash
   cp EVAPOTRAN/server/.env.example EVAPOTRAN/server/.env
   # Edit the .env file with your API keys
   ```

## Development Workflow

### Standard Workflow (Recommended)

1. **Pull the latest changes**
   ```bash
   git pull origin main
   ```

2. **Make your changes**
   Edit files as needed.

3. **Test your changes locally**
   ```bash
   npm run build
   npm run deploy:local
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push your changes to GitHub**
   ```bash
   git push origin main
   ```

6. **GitHub Actions will automatically deploy your changes**
   Check the status at: https://github.com/rafatahmed/FlahaCalc/actions

7. **Verify your changes on the production server**
   Visit https://flaha.org to verify your changes.

### Using the Workflow Script

We provide a script that guides you through the development workflow:

```bash
bash scripts/dev/workflow.sh
```

### Direct Server Edits (Emergency Only)

In case of emergency, you can make changes directly on the server:

1. **SSH into the server**
   ```bash
   ssh root@207.154.202.6
   ```

2. **Run the direct edit script**
   ```bash
   cd /var/www/flahacalc
   bash scripts/server/direct-edit.sh
   ```

3. **Follow the prompts to make, commit, and apply your changes**

## Deployment Options

### Automatic Deployment

Changes pushed to the `main` branch are automatically deployed via GitHub Actions.

### Manual Deployment

You can manually trigger a deployment from GitHub Actions:

1. Go to https://github.com/rafatahmed/FlahaCalc/actions
2. Select the "Deploy to DigitalOcean" workflow
3. Click "Run workflow"
4. Choose whether to apply fixes after deployment
5. Click "Run workflow"

### Deployment with Fixes

If you need to apply fixes after deployment:

```bash
npm run deploy:with-fixes
```

This will commit and push your changes, then run the fix-all script on the server.

## Troubleshooting

If deployment fails:

1. Check the GitHub Actions logs
2. SSH into the server and check the logs:
   ```bash
   pm2 logs flahacalc-server
   tail -f /var/log/nginx/error.log
   ```
3. Run the fix-all script manually:
   ```bash
   bash scripts/server/fix-all.sh
   ```