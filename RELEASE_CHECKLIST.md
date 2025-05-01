# Release Checklist

## Pre-Release Tasks

- [ ] Update version number in:
  - [ ] VERSION file
  - [ ] package.json (if exists)
  - [ ] README.md
- [ ] Update CHANGELOG.md with all notable changes
- [ ] Create RELEASE_NOTES.md with release highlights
- [ ] Ensure all documentation is up-to-date
- [ ] Run final tests on all major browsers
- [ ] Check mobile responsiveness
- [ ] Verify all links work correctly
- [ ] Optimize images and assets

## Release Tasks

- [ ] Commit all changes with message "Prepare X.Y.Z release"
- [ ] Create an annotated Git tag: `git tag -a vX.Y.Z -m "EVAPOTRAN X.Y.Z release"`
- [ ] Push the tag: `git push origin vX.Y.Z`
- [ ] Create GitHub release using the tag
- [ ] Upload release assets (if applicable)
- [ ] Publish release

## Post-Release Tasks

- [ ] Verify the release is accessible
- [ ] Update documentation website (if separate)
- [ ] Announce release on relevant channels
- [ ] Update roadmap with next development priorities
- [ ] Create milestone for next version