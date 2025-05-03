#!/bin/bash

# Exit on error
set -e

echo "FlahaCalc Development Workflow Guide"
echo "===================================="
echo ""
echo "This script will guide you through the development workflow."
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Not in a git repository. Please run this script from the root of the FlahaCalc repository."
    exit 1
fi

echo "Step 1: Make sure your local repository is up to date"
echo "----------------------------------------------------"
echo "Running: git pull origin main"
git pull origin main || { echo "Failed to pull latest changes. Please resolve any conflicts."; exit 1; }
echo ""

echo "Step 2: Make your changes to the codebase"
echo "----------------------------------------"
echo "Edit files as needed. When you're done, continue to step 3."
echo ""

echo "Step 3: Test your changes locally"
echo "--------------------------------"
echo "Running: npm run build"
npm run build || { echo "Build failed. Please fix the errors before continuing."; exit 1; }
echo ""
echo "You can also run: npm run deploy:local to test with the local server"
echo ""

echo "Step 4: Commit your changes"
echo "--------------------------"
echo "Running: git add ."
git add .

echo "Please enter a commit message describing your changes:"
read commit_message
if [ -z "$commit_message" ]; then
    commit_message="Update application $(date)"
fi

echo "Running: git commit -m \"$commit_message\""
git commit -m "$commit_message" || { echo "Commit failed. Please check if there are changes to commit."; exit 1; }
echo ""

echo "Step 5: Push your changes to GitHub"
echo "----------------------------------"
echo "Running: git push origin main"
git push origin main || { echo "Push failed. Please pull the latest changes and try again."; exit 1; }
echo ""

echo "Step 6: GitHub Actions will automatically deploy your changes"
echo "-----------------------------------------------------------"
echo "You can check the status of the deployment at: https://github.com/rafatahmed/FlahaCalc/actions"
echo ""

echo "Step 7: Verify your changes on the production server"
echo "--------------------------------------------------"
echo "Visit https://flaha.org to verify your changes."
echo "If you need to apply any fixes, run: npm run deploy:with-fixes"
echo ""

echo "Development workflow completed successfully!"