#!/bin/bash

# CI Setup Script for Test Assets
# Creates minimal test images if they don't exist in CI environment

set -e

echo "🚀 Setting up test assets for CI environment..."

# Create test images directory
mkdir -p test-data/images

# Function to create a minimal valid JPEG file
create_test_image() {
    local filename="$1"
    local filepath="test-data/images/$filename"
    
    if [ ! -f "$filepath" ]; then
        echo "📸 Creating minimal test image: $filename"
        
        # Create a minimal 1x1 pixel JPEG (valid JPEG format)
        # This is a base64 encoded minimal JPEG that most browsers can handle
        echo "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==" | base64 -d > "$filepath"
        
        if [ -f "$filepath" ]; then
            echo "✅ Created test image: $filepath ($(stat -c%s "$filepath" 2>/dev/null || stat -f%z "$filepath" 2>/dev/null) bytes)"
        else
            echo "❌ Failed to create test image: $filepath"
            exit 1
        fi
    else
        echo "✅ Test image already exists: $filepath"
    fi
}

# Create test images
create_test_image "test-image-1.jpg"
create_test_image "test-image-2.jpg"

# Verify the images
echo ""
echo "📋 Test assets verification:"
ls -la test-data/images/

# Test image validity (if file command is available)
if command -v file >/dev/null 2>&1; then
    echo ""
    echo "🔍 Image format verification:"
    file test-data/images/*.jpg
fi

echo ""
echo "✅ Test assets setup complete!"
