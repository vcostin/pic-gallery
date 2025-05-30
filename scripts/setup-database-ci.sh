#!/bin/bash

# Database setup script for CI environments
# This script sets up SQLite database for E2E tests in GitHub Actions

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in CI environment
if [ "${CI:-false}" = "true" ]; then
    log_info "CI environment detected - using SQLite database setup"
    DATABASE_PROVIDER="sqlite"
    DATABASE_URL="file:./test.db"
else
    log_info "Local environment detected - checking for existing database setup"
    DATABASE_PROVIDER="postgresql"
fi

# Function to setup SQLite database for CI
setup_sqlite_database() {
    log_info "Setting up SQLite database for CI environment..."
    
    # Use SQLite schema
    if [ ! -f "prisma/schema.sqlite.prisma" ]; then
        log_error "SQLite schema file not found: prisma/schema.sqlite.prisma"
        exit 1
    fi
    
    # Copy SQLite schema to main schema location
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    log_success "SQLite schema applied"
    
    # Set database URL for SQLite
    export DATABASE_URL="file:./test.db"
    
    # Generate Prisma client
    log_info "Generating Prisma client for SQLite..."
    
    # Clean up any existing generated clients
    rm -rf src/lib/generated/prisma-client
    rm -rf node_modules/.prisma
    
    # Generate to custom location for our code
    npx prisma generate --schema=prisma/schema.prisma
    
    # Also generate to default location for compatibility
    log_info "Generating Prisma client to default location..."
    cat > prisma/schema.temp.prisma << 'EOF'
// SQLite-specific Prisma schema for CI/CD and testing environments
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Define available user roles
enum UserRole {
  USER
  ADMIN
  // MODERATOR // Uncomment this when needed in the future
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique  // Making email required as it's used for authentication
  password      String?   // Hashed password for credentials login
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(USER)
  accounts      Account[]
  sessions      Session[]
  images        Image[]
  galleries     Gallery[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Image {
  id          String          @id @default(cuid())
  title       String
  description String?
  url         String
  userId      String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags        Tag[]
  inGalleries ImageInGallery[]
  coverFor    Gallery[]       @relation("GalleryCover")
}

model Gallery {
  id          String          @id @default(cuid())
  title       String
  description String?
  isPublic    Boolean         @default(false)
  userId      String
  coverImageId String?        
  coverImage  Image?          @relation("GalleryCover", fields: [coverImageId], references: [id], onDelete: SetNull)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  images      ImageInGallery[]

  // Theming options
  themeColor         String? // e.g., hex code for a primary color
  backgroundColor    String? // e.g., hex code for background
  backgroundImageUrl String? // URL for a background image
  accentColor        String? // e.g., hex code for accents
  fontFamily         String? // e.g., "Arial, sans-serif"
  displayMode        String? // e.g., "carousel", "grid", "slideshow"
  layoutType         String? // e.g., "full-width", "contained"
}

model Tag {
  id     String  @id @default(cuid())
  name   String  @unique
  images Image[]
}

model ImageInGallery {
  id          String   @id @default(cuid())
  imageId     String
  galleryId   String
  description String?
  order       Int      @default(0)  // New field to track image order in the gallery
  image       Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  gallery     Gallery  @relation(fields: [galleryId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([imageId, galleryId])
}
EOF
    
    npx prisma generate --schema=prisma/schema.temp.prisma
    rm prisma/schema.temp.prisma
    
    # Run database migrations
    log_info "Setting up SQLite database..."
    npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
    
    log_success "SQLite database setup completed"
}

# Function to setup PostgreSQL database for local development
setup_postgresql_database() {
    log_info "Setting up PostgreSQL database for local development..."
    
    # Use original PostgreSQL schema
    if [ ! -f "prisma/schema.prisma.backup" ]; then
        # Backup original schema if it exists
        if [ -f "prisma/schema.prisma" ]; then
            cp prisma/schema.prisma prisma/schema.prisma.backup
        fi
    fi
    
    # Generate Prisma client
    log_info "Generating Prisma client for PostgreSQL..."
    npx prisma generate
    
    # Run database migrations
    log_info "Running PostgreSQL migrations..."
    npx prisma migrate dev --name init_e2e_setup
    
    log_success "PostgreSQL database setup completed"
}

# Function to create test user for E2E tests
create_test_user() {
    log_info "Creating E2E test user..."
    
    # Use a Node.js script that imports from the custom path
    cat > create-test-user.js << 'EOF'
const bcrypt = require('bcrypt');
const path = require('path');

async function createTestUser() {
    try {
        // Import from the custom Prisma client location
        const { PrismaClient } = require('./src/lib/generated/prisma-client');
        
        const prisma = new PrismaClient();
        
        const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
        const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
        const testName = process.env.E2E_TEST_USER_NAME || 'E2E Test User';
        
        console.log('Creating user with email:', testEmail);
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: testEmail }
        });
        
        if (existingUser) {
            console.log('✅ Test user already exists');
            await prisma.$disconnect();
            return;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        
        // Create test user
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                name: testName,
                password: hashedPassword,
                role: 'USER'
            }
        });
        
        console.log('✅ Test user created successfully:', user.email);
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

createTestUser().catch(console.error);
EOF
    
    # Run the test user creation script
    node create-test-user.js
    
    # Clean up temporary script
    rm create-test-user.js
    
    log_success "Test user setup completed"
}

# Main setup function
main() {
    log_info "Starting database setup for E2E tests..."
    
    # Check if required environment variables are set
    if [ "${CI:-false}" = "true" ]; then
        # CI environment - use SQLite
        setup_sqlite_database
        
        # Set environment variables for CI (only if GITHUB_ENV exists)
        if [ -n "${GITHUB_ENV:-}" ]; then
            echo "DATABASE_URL=file:./test.db" >> $GITHUB_ENV
            echo "E2E_TEST_USER_EMAIL=e2e-test@example.com" >> $GITHUB_ENV
            echo "E2E_TEST_USER_PASSWORD=TestPassword123!" >> $GITHUB_ENV
            echo "E2E_TEST_USER_NAME=E2E Test User" >> $GITHUB_ENV
            echo "NEXTAUTH_SECRET=test-secret-for-ci" >> $GITHUB_ENV
            echo "NEXTAUTH_URL=http://localhost:3000" >> $GITHUB_ENV
        else
            # Set for current session if not in GitHub Actions
            export DATABASE_URL="file:./test.db"
            export E2E_TEST_USER_EMAIL="e2e-test@example.com"
            export E2E_TEST_USER_PASSWORD="TestPassword123!"
            export E2E_TEST_USER_NAME="E2E Test User"
            export NEXTAUTH_SECRET="test-secret-for-ci"
            export NEXTAUTH_URL="http://localhost:3000"
        fi
        
    else
        # Local environment - use PostgreSQL if available
        if [ -n "${DATABASE_URL:-}" ]; then
            setup_postgresql_database
        else
            log_warning "No DATABASE_URL found - falling back to SQLite for local testing"
            setup_sqlite_database
        fi
    fi
    
    # Create test user
    create_test_user
    
    log_success "Database setup completed successfully!"
    
    # Show database info
    if [ "${CI:-false}" = "true" ]; then
        log_info "Database: SQLite (file:./test.db)"
    else
        log_info "Database: ${DATABASE_URL:-SQLite}"
    fi
}

# Run main function
main "$@"
