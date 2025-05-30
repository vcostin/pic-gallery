# Picture Gallery

A modern, responsive image gallery application built with Next.js that allows users to create, manage, and share their photo collections with enhanced visual components and mobile-first design.

## ✨ Features

### 🎨 Enhanced Gallery Experience
- **Multiple Display Modes**: Carousel, grid (masonry/uniform/compact), slideshow, magazine, and polaroid layouts
- **Touch-Optimized**: Full mobile support with swipe gestures and responsive design
- **Advanced Visual Components**: 
  - Enhanced carousel with auto-play and thumbnail navigation
  - Dynamic grid layouts with hover effects and animations
  - Full-screen slideshow with keyboard navigation
  - Smooth transitions and modern animations powered by Framer Motion

### 🔐 User Management
- **Secure Authentication**: NextAuth.js integration with secure sign-in/out
- **User Profiles**: Customizable profiles with avatar support

### 🖼️ Image & Gallery Management
- **Smart Upload System**: Drag-and-drop upload with progress tracking
- **Gallery Organization**: Create and organize galleries with multiple images
- **Flexible Ordering**: Drag-and-drop reordering with visual feedback
- **Gallery Covers**: Set cover images to highlight your best photos
- **Privacy Controls**: Public/private gallery settings
- **Rich Metadata**: Titles, descriptions, and tag management system

### 🎭 Theming & Customization
- **Dynamic Themes**: Customizable color schemes and layouts
- **Dark Mode**: Complete dark mode support
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Multiple Layout Types**: Full-width, container, masonry, and compact options

### 🚀 Modern UI/UX
- **Interactive Components**: Hover effects, loading states, and smooth animations
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance Optimized**: Lazy loading and optimized image delivery
- **Toast Notifications**: Real-time feedback for user actions

## 📖 Documentation

For developers working on this project, we maintain comprehensive documentation:

### 🗄️ Database & Environment Setup
- [🔧 Database Environment Setup](/docs/database-environment-setup.md) - Comprehensive guide for dual database configuration (PostgreSQL/SQLite)
- [⚡ Database Quick Reference](/docs/database-quick-reference.md) - Quick commands and troubleshooting for database operations

### 🔄 Development & Architecture
- [📊 Refactoring Documentation Index](/docs/refactoring-documentation-index.md) - Central hub for all refactoring documentation
- [🔄 Consolidated Refactoring Strategy](/docs/refactoring-strategy-consolidated.md) - Overview of component and schema migration strategy
- [📈 Component Refactoring Progress](/docs/component-refactoring-progress.md) - Current status of the refactoring effort
- [📜 Component Migrations History](/docs/component-migrations-history.md) - Historical record of completed migrations

### 🧪 Testing & Quality
- [🧪 E2E Testing Guide](/docs/e2e-testing-guide.md) - Comprehensive testing documentation
- [✅ Enhanced Gallery Completion Report](/ENHANCED_GALLERY_COMPLETION_REPORT.md) - Latest enhancement documentation

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.3** (App Router) - React framework with server-side rendering
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### Backend & Database
- **Prisma 6.8** - Modern database ORM with type safety
- **NextAuth.js 4.24** - Authentication solution
- **PostgreSQL/SQLite** - Dual database support (PostgreSQL for production, SQLite for CI/testing)

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion 12** - Advanced animations and transitions
- **Heroicons 2** - Beautiful SVG icons
- **PostCSS** - CSS processing and optimization

### Enhanced Features
- **@dnd-kit** - Modern drag-and-drop functionality
- **@tanstack/react-query 5** - Server state management
- **React Hook Form 7** - Performant form handling
- **Zod 3** - Runtime type validation
- **React Error Boundary** - Error handling and recovery

### Development & Testing
- **Jest 29** - Unit testing framework (139+ passing tests)
- **Playwright 1.52** - E2E testing with cross-browser support
- **Testing Library** - React component testing utilities
- **ESLint 9** - Code linting and quality
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Database (PostgreSQL recommended, SQLite for development/CI)

> 💡 **Database Setup**: For detailed database configuration including dual PostgreSQL/SQLite setup for different environments, see our [Database Environment Setup Guide](/docs/database-environment-setup.md).

### Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="your-database-url"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Upload service configuration
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"
```

### Installation & Setup

```bash
# Clone the repository
git clone [repository-url]
cd pic-gallery

# Install dependencies
npm install

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Start the development server
npm run dev
```

### Development Scripts

```bash
# Development with Turbopack (faster builds)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run updatedb          # Push schema changes
npx prisma studio        # Open database GUI
# See Database Quick Reference (/docs/database-quick-reference.md) for more commands

# Code quality
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting issues

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# E2E Testing
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive test runner
npm run test:e2e:debug   # Debug mode
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── galleries/            # Gallery CRUD operations
│   │   ├── images/               # Image management
│   │   └── upload/               # File upload handling
│   ├── galleries/                # Gallery pages
│   │   ├── [id]/                 # Dynamic gallery routes
│   │   │   ├── edit/             # Gallery editing
│   │   │   └── page.tsx          # Gallery details
│   │   └── create/               # Gallery creation
│   ├── images/                   # Image management pages
│   ├── auth/                     # Authentication pages
│   └── profile/                  # User profile management
│
├── components/                   # Reusable React components
│   ├── gallery-display/          # Enhanced gallery components
│   │   ├── EnhancedCarousel.tsx  # Modern carousel with touch support
│   │   ├── EnhancedGalleryGrid.tsx # Multiple grid layouts
│   │   ├── EnhancedSlideshow.tsx # Full-screen slideshow
│   │   └── ThemedGalleryView.tsx # Main gallery orchestrator
│   ├── GalleryImageCards.tsx     # Image card components
│   ├── CreateGallery/            # Gallery creation components
│   ├── SelectImagesDialog.tsx    # Image selection interface
│   └── __tests__/                # Component tests
│
├── lib/                          # Utility functions & configurations
│   ├── hooks/                    # Custom React hooks
│   │   └── useEnhancedGallery.ts # Enhanced gallery management
│   ├── services/                 # API service layers
│   ├── utils/                    # Utility functions
│   │   └── typeMappers.ts        # Type conversion utilities
│   ├── schemas.ts                # Zod validation schemas
│   └── logger.ts                 # Logging configuration
│
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Database models
│   └── migrations/               # Migration history
│
├── public/                       # Static assets
│   └── uploads/                  # User-uploaded images
│
├── e2e-tests/                    # End-to-end tests
│   ├── helpers.ts                # Test utility functions
│   ├── auth.spec.ts              # Authentication tests
│   ├── gallery.spec.ts           # Gallery functionality tests
│   └── authenticated.spec.ts     # Authenticated user tests
│
└── docs/                         # Project documentation
    ├── refactoring-documentation-index.md
    ├── e2e-testing-guide.md
    └── component-template-pattern.md
```

## 🔌 API Routes

### Authentication
- `GET/POST /api/auth/*` - NextAuth.js authentication endpoints

### Gallery Management
- `GET /api/galleries` - List all galleries (with pagination)
- `POST /api/galleries` - Create new gallery
- `GET /api/galleries/[id]` - Get specific gallery details
- `PUT /api/galleries/[id]` - Update gallery (title, description, settings)
- `DELETE /api/galleries/[id]` - Delete gallery
- `POST /api/galleries/[id]/images` - Add images to gallery
- `DELETE /api/galleries/[id]/images/[imageId]` - Remove image from gallery

### Image Management
- `GET /api/images` - List user's images (with filtering and search)
- `POST /api/images` - Upload new images
- `GET /api/images/[id]` - Get specific image details
- `PUT /api/images/[id]` - Update image metadata
- `DELETE /api/images/[id]` - Delete image
- `GET /api/images/[id]/usage` - Get image usage in galleries

### File Upload
- `POST /api/upload` - Handle file uploads with progress tracking
- `DELETE /api/upload/[id]` - Remove uploaded files

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete user account

## 🧪 Testing

### Unit Tests (Jest + Testing Library)
- **139+ passing tests** with comprehensive coverage
- React component testing with proper act() handling
- Mocked services and hooks for isolated testing
- Snapshot testing for UI components

```bash
npm test                    # Run all unit tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
```

### End-to-End Tests (Playwright)
- Cross-browser testing (Chrome, Firefox, Safari)
- Single-user strategy for consistent test data
- Authentication flow testing
- Gallery creation and management workflows
- Mobile responsiveness testing

```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive test runner
npm run test:e2e:debug     # Debug mode with DevTools
npm run test:e2e:report    # View HTML test report
```

### Test Categories
- **Authentication Tests**: Login, registration, logout flows
- **Gallery Tests**: CRUD operations, image management
- **UI Tests**: Component interactions, responsive design
- **Integration Tests**: Full user workflows
- **Performance Tests**: Loading times, image optimization

## 🚀 Deployment

This Next.js application can be deployed to various platforms. **Note**: Currently, images are stored locally in the `public/uploads` directory. For production deployment, you'll need to implement a cloud storage solution.

### 🔵 Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Connect your project
vercel

# 3. Deploy
vercel --prod
```

**Important**: Vercel's serverless environment doesn't support persistent file storage. You'll need to integrate with a service like:
- Vercel Blob Storage
- AWS S3
- Cloudinary
- UploadThing

### 🟠 Netlify
```bash
# 1. Build command
npm run build

# 2. Publish directory
.next
```

**Note**: Similar to Vercel, you'll need external storage for uploaded images.

### 🐳 Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Volume Mount**: For persistent image storage, mount a volume:
```bash
docker run -v /host/uploads:/app/public/uploads pic-gallery
```

### Required Environment Variables
```bash
# Core Configuration
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Optional: Future image hosting
# UPLOADTHING_SECRET="your-uploadthing-secret"
# UPLOADTHING_APP_ID="your-uploadthing-app-id"
# CLOUDINARY_URL="your-cloudinary-url"
```

### ⚠️ Current Limitations
- **Local Storage Only**: Images are stored in `public/uploads/`
- **No CDN**: Images served directly from the application
- **Scaling Issues**: File storage not suitable for multiple server instances
- **Backup Concerns**: Manual backup required for uploaded images

### 🔮 Future Improvements Needed
- Implement cloud storage integration (AWS S3, Cloudinary, etc.)
- Add image CDN for better performance
- Implement proper backup and disaster recovery
- Add image optimization and resizing
- Support for multiple file formats and sizes

## 🗄️ Database Schema

The application uses **Prisma ORM** with dual database support (PostgreSQL for production, SQLite for CI/testing) to manage the database schema. The schema includes comprehensive relationships and supports advanced features like theming and gallery customization.

> 📚 **Database Setup**: For detailed information about our dual database configuration, environment switching, and setup procedures, see the [Database Environment Setup Guide](/docs/database-environment-setup.md).

### Core Entities

#### 👤 User
- **Authentication**: Email/password with NextAuth.js integration
- **Roles**: USER (default), ADMIN with expandable role system
- **Profiles**: Name, email, avatar image support
- **Relations**: Owns galleries and images

#### 🖼️ Image
- **Metadata**: Title, description, URL, creation timestamps
- **Organization**: Tag system for categorization and search
- **Ownership**: User-owned with cascade deletion
- **Usage**: Can be used in multiple galleries with different descriptions

#### 🎨 Gallery
- **Content**: Title, description, public/private visibility
- **Organization**: User-owned with cover image selection
- **Theming**: Comprehensive customization options
  - Color schemes (theme, background, accent colors)
  - Layout types (full-width, contained, grid layouts)
  - Display modes (carousel, grid, slideshow, magazine, polaroid)
  - Typography (custom font families)
  - Background images and patterns
- **Relations**: Contains multiple images with ordering

#### 🏷️ Tag
- **Structure**: Simple name-based categorization
- **Usage**: Many-to-many relationship with images
- **Features**: Auto-suggestion and management

#### 🔗 ImageInGallery (Junction Table)
- **Purpose**: Links images to galleries with gallery-specific data
- **Features**: Custom descriptions per gallery, drag-and-drop ordering
- **Flexibility**: Same image can appear in multiple galleries with different contexts

### Relationship Diagram
```
User ──┬── Gallery ──┬── ImageInGallery ──── Image ──── Tag
       │             │                              ╱╱
       │             └── coverImage (optional)    ╱╱ many-to-many
       │                                        ╱╱
       └── Image ────────────────────────────╱╱
```

### Database Features
- **ACID Compliance**: Full PostgreSQL transaction support
- **Migration System**: Prisma-managed schema evolution
- **Cascade Deletion**: Automatic cleanup of related records
- **Unique Constraints**: Prevent duplicate relationships
- **Optimized Queries**: Includes eager loading for performance

## 🤝 Contributing

We welcome contributions from the community! This project follows modern development practices and maintains high code quality standards.

### 🚀 Quick Start for Contributors

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/pic-gallery.git
cd pic-gallery

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Set up database
npx prisma migrate dev
npx prisma generate

# 5. Start development server
npm run dev
```

### 📋 Development Guidelines

#### Code Quality
- **TypeScript**: Strict typing with Zod schema validation
- **Linting**: ESLint with Next.js configuration
- **Testing**: Jest for unit tests, Playwright for E2E
- **Code Style**: Prettier with consistent formatting

#### Testing Requirements
```bash
# Run all tests before submitting PR
npm test                  # Unit tests
npm run test:coverage     # Coverage report
npm run test:e2e         # End-to-end tests
npm run lint             # Code linting
```

#### Component Architecture
- **Schema-First**: Use Zod schemas for type safety
- **Service Layer**: Centralized API interaction
- **Component Organization**: Clear separation of concerns
- **Documentation**: Comprehensive inline and markdown docs

### 🔄 Contribution Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   git checkout -b fix/bug-description
   git checkout -b docs/documentation-update
   ```

2. **Development Process**
   - Write tests first (TDD approach)
   - Use schema-based types from `@/lib/schemas`
   - Follow existing component patterns
   - Add documentation for new features

3. **Commit Standards**
   ```bash
   # Use conventional commits
   git commit -m "feat: add gallery theming system"
   git commit -m "fix: resolve image ordering bug"
   git commit -m "docs: update API documentation"
   ```

4. **Quality Checks**
   ```bash
   npm run lint:fix          # Fix linting issues
   npm test                  # Ensure tests pass
   npm run test:e2e         # Verify E2E functionality
   ```

5. **Submit Pull Request**
   - Clear description of changes
   - Link to relevant issues
   - Include screenshots for UI changes
   - Ensure CI passes

### 🐛 Bug Reports

When reporting bugs, please include:
- **Environment**: Browser, OS, Node version
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Console Errors**: Any error messages

### 💡 Feature Requests

For new features, please provide:
- **Use Case**: Why this feature is needed
- **Proposed Solution**: How it should work
- **Alternatives**: Other approaches considered
- **Implementation Ideas**: Technical suggestions

### 📚 Areas for Contribution

- **🎨 UI/UX Improvements**: Enhanced gallery layouts, themes
- **🔧 Performance**: Image optimization, caching strategies  
- **🧪 Testing**: Additional test coverage, edge cases
- **📖 Documentation**: Tutorials, API docs, examples
- **🌐 Accessibility**: WCAG compliance, keyboard navigation
- **🔌 Integrations**: Third-party services, APIs

### 👥 Community

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Report bugs and request features
- **Pull Requests**: Submit code improvements
- **Code Review**: Help review other contributions

## 📚 Learn More

### 🔗 Technology Documentation

**Core Framework & Libraries**
- [📘 Next.js Documentation](https://nextjs.org/docs) - React framework with App Router
- [⚛️ React 19 Documentation](https://react.dev/) - Latest React features and hooks
- [🎨 Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [💨 Framer Motion](https://www.framer.com/motion/) - Production-ready motion library

**Backend & Database**
- [🗃️ Prisma Documentation](https://www.prisma.io/docs) - Next-generation ORM
- [🔐 NextAuth.js](https://next-auth.js.org) - Authentication for Next.js
- [🐘 PostgreSQL](https://www.postgresql.org/docs/) - Advanced open source database

**Development & Testing**
- [📝 TypeScript Handbook](https://www.typescriptlang.org/docs/) - Strongly typed JavaScript
- [✅ Zod](https://zod.dev/) - TypeScript-first schema validation
- [🧪 Jest Testing Framework](https://jestjs.io/docs/getting-started) - JavaScript testing
- [🎭 Playwright](https://playwright.dev/) - End-to-end testing

### 🎯 Key Concepts & Patterns

**Schema-First Development**
- All data types derived from Zod schemas (`@/lib/schemas`)
- Runtime validation with compile-time type safety
- Centralized API contracts and form validation

**Component Architecture**
- Service layer for API interactions (`@/lib/services/`)
- Type mappers for data transformation (`@/lib/utils/typeMappers`)
- Reusable UI components with consistent interfaces

**Gallery System**
- Enhanced visual components with multiple display modes
- Touch-optimized mobile experience with gesture support
- Comprehensive theming system for customization

### 🛠️ Advanced Topics

**Performance Optimization**
- Image lazy loading and optimization strategies
- React Query for server state management
- Efficient database queries with Prisma includes

**Testing Strategy**
- Unit testing with Jest and React Testing Library
- End-to-end testing with Playwright
- Schema validation testing patterns

**Deployment & DevOps**
- Environment configuration management
- Database migration strategies
- CI/CD pipeline setup

### 🎨 Design Resources

**UI/UX Inspiration**
- [📱 Gallery Design Patterns](https://ui-patterns.com/patterns/image-gallery) - Common UI patterns
- [🎭 Animation Examples](https://www.framer.com/motion/examples/) - Motion design inspiration
- [🎨 Color Theory](https://www.interaction-design.org/literature/topics/color-theory) - Color in UI design



### 🚀 Extension Ideas

**Enhanced Features**
- Social features (likes, comments, sharing)
- Advanced search with AI-powered tagging
- Collaborative galleries with multiple owners
- Export capabilities (PDF, slideshow, print layouts)
- Integration with stock photo APIs
- Advanced image editing tools
- Gallery analytics and insights

**Performance & Scale**
- CDN integration for global image delivery
- Progressive web app (PWA) features
- Offline gallery viewing capabilities
- Background sync for uploads
- Image compression and format optimization
