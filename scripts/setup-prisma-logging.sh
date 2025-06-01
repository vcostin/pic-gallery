#!/bin/bash
# Quick start script for enabling Prisma query logging

echo "🔧 Prisma Query Logging Setup"
echo "==============================="
echo

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "Found existing .env.local file"
    
    # Check if PRISMA_QUERY_LOG is already set
    if grep -q "PRISMA_QUERY_LOG" .env.local; then
        echo "PRISMA_QUERY_LOG is already configured in .env.local"
        current_value=$(grep "PRISMA_QUERY_LOG" .env.local | cut -d'"' -f2)
        echo "Current value: $current_value"
        echo
        echo "To change the setting:"
        echo "1. Edit .env.local manually, or"
        echo "2. Run: sed -i '' 's/PRISMA_QUERY_LOG=\".*\"/PRISMA_QUERY_LOG=\"true\"/' .env.local"
    else
        echo "Adding PRISMA_QUERY_LOG to existing .env.local..."
        echo '' >> .env.local
        echo '# Prisma query logging (for debugging)' >> .env.local
        echo 'PRISMA_QUERY_LOG="false"' >> .env.local
        echo "✅ Added PRISMA_QUERY_LOG to .env.local"
    fi
else
    echo "Creating new .env.local file..."
    cat > .env.local << 'EOF'
# Local environment variables
# Copy from .env.example and customize as needed

# Prisma query logging (for debugging)
PRISMA_QUERY_LOG="false"
EOF
    echo "✅ Created .env.local with PRISMA_QUERY_LOG"
fi

echo
echo "📖 Usage Instructions:"
echo "----------------------"
echo "To enable query logging:"
echo "  Set PRISMA_QUERY_LOG=\"true\" in .env.local"
echo
echo "To disable query logging:"
echo "  Set PRISMA_QUERY_LOG=\"false\" in .env.local"
echo
echo "Quick commands:"
echo "  Enable:  echo 'PRISMA_QUERY_LOG=\"true\"' >> .env.local"
echo "  Disable: sed -i '' 's/PRISMA_QUERY_LOG=\"true\"/PRISMA_QUERY_LOG=\"false\"/' .env.local"
echo
echo "⚠️  Remember to restart your dev server after changing this setting!"
echo "   npm run dev"
echo
echo "For more details, see: docs/prisma-query-logging.md"
