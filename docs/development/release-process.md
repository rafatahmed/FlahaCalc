# Release Process

This guide explains how to create a new release of EVAPOTRAN from your local development machine.

## Prerequisites

- Ensure you have the latest code from the main branch
- Make sure all changes for the release are committed
- Verify that all tests pass

## Creating a Release

1. **Pull the latest changes from the main branch**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Generate release notes**

   ```bash
   # Replace 0.2.0 with your target version number
   npm run release:notes 0.2.0
   ```

   This creates a `RELEASE_NOTES.md` file with a template.

3. **Edit the release notes**

   Open `RELEASE_NOTES.md` in your editor and add detailed information about the release:
   - Key features
   - Bug fixes
   - Performance improvements
   - Known issues

4. **Create the release**

   ```bash
   # Replace 0.2.0 with your target version number
   npm run release:create 0.2.0
   ```

   This script will:
   - Update version numbers in all relevant files
   - Commit these changes
   - Create a Git tag
   - Push the changes and tag to GitHub

5. **Create a GitHub release**

   - Go to https://github.com/rafatahmed/FlahaCalc/releases/new
   - Select the tag you just created (e.g., `v0.2.0`)
   - Set the release title (e.g., "EVAPOTRAN 0.2.0")
   - Copy and paste the content from `RELEASE_NOTES.md`
   - Click "Publish release"

## After Creating a Release

After creating a release, you should:

1. **Deploy to production**

   ```bash
   npm run deploy:production
   ```

2. **Verify the deployment**

   Check that the new version is running correctly on the production server.

3. **Start planning the next release**

   Update your roadmap and begin work on the next set of features.