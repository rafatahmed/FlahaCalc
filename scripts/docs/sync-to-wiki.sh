#!/bin/bash

# Clone the wiki repository
git clone https://github.com/flaha-agritech/evapotran.wiki.git wiki-temp

# Copy documentation files to wiki
cp -r docs/*.md wiki-temp/
cp -r docs/*/*.md wiki-temp/

# Fix links for wiki format
cd wiki-temp
find . -name "*.md" -exec sed -i 's/\.md\)/)/g' {} \;
find . -name "*.md" -exec sed -i 's/\.md#/#/g' {} \;

# Commit and push changes
git add .
git commit -m "Update wiki documentation"
git push

# Clean up
cd ..
rm -rf wiki-temp

echo "Wiki documentation updated!"