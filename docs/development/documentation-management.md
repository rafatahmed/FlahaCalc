# Documentation Management

EVAPOTRAN documentation is maintained in multiple formats to ensure accessibility for different users.

## Documentation Sources

1. **Source Files**: Markdown files in the `docs/` directory of the main repository
2. **ReadTheDocs**: Web-based documentation at [https://evapotran-doc.flaha.org](https:/-evapotran-doc.flaha.org)
3. **GitHub Wiki**: Wiki pages at [https://github.com/flaha-agritech/evapotran/wiki](https://github.com/flaha-agritech/evapotran-wiki)
4. **PDF Documentation**: Downloadable PDF from ReadTheDocs

## Documentation Workflow

1. **Update Source Files**: Make changes to the markdown files in the `docs/` directory
2. **Build Documentation**: Run `mkdocs build` to generate the static site
3. **Automatic Deployment**: Push changes to the main branch to trigger automatic deployment:
   - GitHub Actions will build and deploy to ReadTheDocs
   - GitHub Actions will sync changes to the GitHub Wiki

## Synchronization Process

The documentation synchronization is handled by:

1. **ReadTheDocs Integration**: Automatically builds documentation from the repository
2. **Wiki Sync GitHub Action**: Syncs documentation to the GitHub Wiki
3. **PDF Generation**: Handled by ReadTheDocs

## Manual Synchronization

If needed, you can manually sync documentation to the wiki:

```bash
# From the project root
bash scripts/docs/sync-to-wiki.sh "Your commit message here"
```

## Documentation Structure

The documentation follows this structure:

- **Getting Started**: Introduction, installation, and quick start guides
- **User Guide**: Detailed instructions for using EVAPOTRAN
- **Technical Reference**: Technical details about algorithms and methods
- **Development**: Guidelines for developers
- **FAQ**: Frequently asked questions
- **Release Notes**: Information about each release