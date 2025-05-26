#!/bin/bash

# Create test-screenshots directory if it doesn't exist
mkdir -p test-screenshots

# Remove all PNG files from the root directory
echo "Removing PNG files from root directory..."
find . -maxdepth 1 -name "*.png" -type f -delete

echo "Done! All PNG files have been removed from the root directory."
echo "Future test screenshots will be stored in the test-screenshots directory."
