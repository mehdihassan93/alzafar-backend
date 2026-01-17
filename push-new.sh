#!/bin/bash

# Check if there are any changes to commit
if [[ -z $(git status -s) ]]; then
  echo "No changes to push."
  exit 0
fi

# Create a unique branch name using date and time
BRANCH_NAME="update-$(date +'%Y%m%d-%H%M%S')"

# Switch to the new branch
git checkout -b "$BRANCH_NAME"

# Add all changes
git add .

# Prompt for a commit message or use a default one
COMMIT_MSG=${1:-"Update: $(date)"}
git commit -m "$COMMIT_MSG"

# Push the new branch to origin
git push origin "$BRANCH_NAME"

echo "Successfully pushed to new branch: $BRANCH_NAME"
