#!/bin/bash

# Turbopack vs Webpack Build Performance Comparison
# This script measures build times for both Turbopack and Webpack builds

echo "🚀 Turbopack vs Webpack Build Performance Comparison"
echo "=================================================="

# Clean build directory first
echo "🧹 Cleaning build directory..."
rm -rf .next

# Test Turbopack build
echo ""
echo "📦 Testing Turbopack Build..."
echo "------------------------------"
start_time=$(date +%s)
npm run build > turbopack_build.log 2>&1
turbopack_exit_code=$?
end_time=$(date +%s)
turbopack_time=$((end_time - start_time))

if [ $turbopack_exit_code -eq 0 ]; then
    echo "✅ Turbopack build completed successfully in ${turbopack_time}s"
else
    echo "❌ Turbopack build failed (exit code: $turbopack_exit_code)"
fi

# Clean build directory for fair comparison
echo ""
echo "🧹 Cleaning build directory for webpack test..."
rm -rf .next

# Test Webpack build
echo ""
echo "📦 Testing Webpack Build..."
echo "----------------------------"
start_time=$(date +%s)
npm run build:webpack > webpack_build.log 2>&1
webpack_exit_code=$?
end_time=$(date +%s)
webpack_time=$((end_time - start_time))

if [ $webpack_exit_code -eq 0 ]; then
    echo "✅ Webpack build completed successfully in ${webpack_time}s"
else
    echo "❌ Webpack build failed (exit code: $webpack_exit_code)"
fi

# Performance comparison
echo ""
echo "📊 Performance Summary"
echo "======================"
echo "Turbopack build time: ${turbopack_time}s"
echo "Webpack build time:   ${webpack_time}s"

if [ $turbopack_time -lt $webpack_time ]; then
    improvement=$(echo "scale=1; (($webpack_time - $turbopack_time) / $webpack_time) * 100" | bc)
    echo "🎉 Turbopack is ${improvement}% faster than Webpack!"
elif [ $webpack_time -lt $turbopack_time ]; then
    slower=$(echo "scale=1; (($turbopack_time - $webpack_time) / $webpack_time) * 100" | bc)
    echo "⚠️  Turbopack is ${slower}% slower than Webpack"
else
    echo "⚖️  Both builds took the same time"
fi

# Bundle size comparison
echo ""
echo "📏 Bundle Size Analysis"
echo "======================="
if [ -f ".next/static/chunks/main-*.js" ]; then
    main_chunk_size=$(ls -la .next/static/chunks/main-*.js | awk '{print $5}')
    echo "Main chunk size: $(numfmt --to=iec $main_chunk_size)"
fi

if [ -f ".next/BUILD_ID" ]; then
    build_id=$(cat .next/BUILD_ID)
    echo "Build ID: $build_id"
fi

echo ""
echo "📋 Build logs saved to:"
echo "- turbopack_build.log"
echo "- webpack_build.log"

# Clean up
echo ""
echo "🧹 Cleaning up log files..."
rm -f turbopack_build.log webpack_build.log

echo ""
echo "✨ Performance comparison complete!"
