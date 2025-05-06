#!/bin/bash

# Script to synchronize documentation with GitHub Wiki
# Usage: ./sync-to-wiki.sh [commit message]

# Default commit message
COMMIT_MSG=${1:-"Update wiki documentation"}

# Configuration
WIKI_REPO="https://github.com/rafatahmed/FlahaCalc.wiki.git"
TEMP_DIR="wiki-temp"
DOCS_DIR="docs"

echo "Starting documentation sync to GitHub Wiki..."

# Clone the wiki repository
echo "Cloning wiki repository..."
git clone $WIKI_REPO $TEMP_DIR || {
  echo "Failed to clone wiki repository. Creating wiki first..."
  mkdir -p $TEMP_DIR
  cd $TEMP_DIR
  git init
  echo "# FlahaCalc Documentation" > Home.md
  echo "" >> Home.md
  echo "Welcome to the FlahaCalc Wiki!" >> Home.md
  git add Home.md
  git commit -m "Initial wiki setup"
  git remote add origin $WIKI_REPO
  cd ..
}

# Pull latest changes if the wiki already exists
echo "Pulling latest changes from wiki..."
cd $TEMP_DIR
git pull origin master || echo "Could not pull, continuing with local copy"
cd ..

# Create Home page from index.md
echo "Creating Home page..."
if [ -f "$DOCS_DIR/index.md" ]; then
  cp $DOCS_DIR/index.md $TEMP_DIR/Home.md
else
  echo "# FlahaCalc Documentation" > $TEMP_DIR/Home.md
  echo "" >> $TEMP_DIR/Home.md
  echo "Welcome to the FlahaCalc Wiki!" >> $TEMP_DIR/Home.md
fi

# Copy documentation files to wiki
echo "Copying documentation files to wiki..."
if [ -d "$DOCS_DIR" ]; then
  find $DOCS_DIR -name "*.md" -not -path "$DOCS_DIR/index.md" | while read file; do
      # Get relative path without docs/ prefix and .md suffix
      rel_path=${file#$DOCS_DIR/}
      rel_path=${rel_path%.md}
      
      # Replace directory separators with hyphens
      wiki_name=$(echo $rel_path | sed 's/\//-/g')
      
      # Copy the file with the new name
      cp "$file" "$TEMP_DIR/$wiki_name.md"
      
      echo "  Copied $file to $wiki_name.md"
  done
fi

# Fix links for wiki format
echo "Fixing links for wiki format..."
cd $TEMP_DIR
find . -name "*.md" -exec sed -i 's/\.md)/)/g' {} \;
find . -name "*.md" -exec sed -i 's/\.md#/#/g' {} \;

# Fix internal links to use Wiki format
find . -name "*.md" -exec sed -i 's/(\([^)]*\)\/\([^)]*\))/(\1-\2)/g' {} \;

# Add sidebar navigation
echo "Creating _Sidebar.md file..."
cat > _Sidebar.md << 'EOL'
# Navigation

- [Home](Home)
- **Getting Started**
  - [Introduction](getting-started-introduction)
  - [Installation](getting-started-installation)
  - [Quick Start](getting-started-quick-start)
- **User Guide**
  - [Overview](user-guide-overview)
  - [Manual Calculator](user-guide-manual-calculator)
  - [EPW Import](user-guide-epw-import)
  - [Weather Visualization](user-guide-weather-visualization)
  - [Live Weather](user-guide-live-weather)
- **Technical Reference**
  - [Architecture](technical-architecture)
  - [Calculation Methods](technical-calculation-methods)
- **Development**
  - [Contributing](development-contributing)
  - [Code Guidelines](development-code-guidelines)
  - [Project Structure](development-project-structure)
- **FAQ**
  - [General](faq-general)
  - [Technical Issues](faq-technical-issues)
- [Release Notes](releases-index)
EOL

# Create footer with link to main documentation
echo "Creating _Footer.md file..."
cat > _Footer.md << 'EOL'
---
For the full documentation with better navigation and search capabilities, visit our [documentation site](https://evapotran-doc.flaha.org).
EOL

# Commit and push changes
echo "Committing and pushing changes..."
git add .
git commit -m "$COMMIT_MSG" || echo "No changes to commit"

# Force push with lease (safer than force push)
echo "Pushing changes to wiki repository..."
git push --force-with-lease origin master || {
  echo "Force push failed, trying regular push..."
  git push origin master || {
    echo "Regular push failed. Trying to push to main branch..."
    git push origin main || {
      echo "All push attempts failed. You may need to manually resolve conflicts."
      echo "Try: cd $TEMP_DIR && git push -u origin master"
    }
  }
}

# Clean up
cd ..
rm -rf $TEMP_DIR

echo "Wiki documentation updated successfully!"
echo "Visit https://github.com/rafatahmed/FlahaCalc/wiki to see the changes."


