#!/bin/bash
# Chercher Building Material Retail Shop - GitHub Push Script
set -e

if [ -z "$1" ]; then
  echo "=========================================================="
  echo "Chercher Shop Admin - Push to GitHub"
  echo "=========================================================="
  echo "Usage:"
  echo "  ./push_to_github.sh <GITHUB_USERNAME>"
  echo "  or"
  echo "  ./push_to_github.sh <GITHUB_USERNAME> <PERSONAL_ACCESS_TOKEN>"
  echo ""
  echo "Example:"
  echo "  ./push_to_github.sh your-username"
  echo "=========================================================="
  exit 1
fi

USERNAME="$1"
TOKEN="$2"
REPO="chercher-shop-admin"

git branch -M main
git remote remove origin 2>/dev/null || true

if [ -n "$TOKEN" ]; then
  git remote add origin "https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/${REPO}.git"
else
  git remote add origin "https://github.com/${USERNAME}/${REPO}.git"
fi

echo "Connecting to GitHub repository: ${USERNAME}/${REPO}..."
git push -u origin main
echo "Successfully pushed Chercher Building Material Retail Shop to https://github.com/${USERNAME}/${REPO}"
