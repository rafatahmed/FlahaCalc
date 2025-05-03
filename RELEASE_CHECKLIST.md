# Release Checklist

## Pre-Release Tasks

- [ ] Ensure all features for this release are complete
- [ ] Run all tests and fix any failures
- [ ] Update documentation for new features
- [ ] Run final tests on all major browsers
- [ ] Check mobile responsiveness
- [ ] Verify all links work correctly
- [ ] Optimize images and assets

## Release Preparation

- [ ] Generate release notes:
  ```bash
  npm run release:notes 0.2.0  # Replace with your version
  ```
- [ ] Edit RELEASE_NOTES.md to add detailed information
- [ ] Update CHANGELOG.md with all notable changes
- [ ] Review and finalize release notes

## Creating the Release

- [ ] Create the release:
  ```bash
  npm run release:create 0.2.0  # Replace with your version
  ```
  This will:
  - Update version numbers in all files
  - Commit the changes
  - Create an annotated Git tag
  - Push changes and tag to GitHub

- [ ] Create a GitHub release:
  - Go to https://github.com/rafatahmed/FlahaCalc/releases/new
  - Select the tag you just created
  - Add the release title (e.g., "EVAPOTRAN 0.2.0")
  - Copy content from RELEASE_NOTES.md
  - Publish the release

## Post-Release Tasks

- [ ] Deploy the release to production:
  ```bash
  npm run deploy:production
  ```
- [ ] Verify the release is accessible and functioning correctly
- [ ] Announce release on relevant channels
- [ ] Update roadmap with next development priorities
