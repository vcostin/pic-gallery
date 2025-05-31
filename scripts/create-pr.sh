#!/bin/bash

# Open GitHub PR creation page with pre-filled parameters
echo "🚀 Opening GitHub PR creation page..."
echo ""
echo "Repository: vcostin/pic-gallery"
echo "Branch: optimize/test-performance → main"
echo ""

# GitHub PR URL with parameters
REPO_URL="https://github.com/vcostin/pic-gallery"
PR_URL="${REPO_URL}/compare/main...optimize/test-performance?expand=1"

echo "Opening: ${PR_URL}"
echo ""
echo "The PR template has been created at .github/pr-template.md"
echo "Copy and paste the content from that file into the PR description."

# Try to open in default browser
if command -v open >/dev/null 2>&1; then
    open "${PR_URL}"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${PR_URL}"
elif command -v start >/dev/null 2>&1; then
    start "${PR_URL}"
else
    echo ""
    echo "Please manually open this URL in your browser:"
    echo "${PR_URL}"
fi

echo ""
echo "✅ PR creation process initiated!"
