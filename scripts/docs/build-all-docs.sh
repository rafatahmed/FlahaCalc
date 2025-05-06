#!/bin/bash

# Build MkDocs documentation
echo "Building MkDocs documentation..."
mkdocs build

# Copy the built documentation to the application docs folder
echo "Copying documentation to application..."
cp -r site/* EVAPOTRAN/docs/

# Generate PDF documentation
echo "Generating PDF documentation..."
mkdir -p EVAPOTRAN/docs/pdf
npx md-to-pdf --config-file .md-to-pdf.json "docs/**/*.md" --output-dir EVAPOTRAN/docs/pdf/evapotran-docs.pdf

echo "Documentation build complete!"