# Picture Gallery

A modern image gallery application built with Next.js that allows users to manage and share their photo collections.

## Features

- **User Authentication**: Secure sign-in functionality
- **Image Upload**: Upload and manage your images with titles, descriptions, and tags
- **Gallery Management**: Create and organize galleries with multiple images
- **Gallery Covers**: Set cover images for galleries to highlight your best photos
- **Image Ordering**: Arrange images in your galleries in any order you prefer
- **Privacy Controls**: Set galleries as public or private
- **Interactive UI**: 
  - Responsive image grid layouts
  - Image carousel for viewing
  - Dark mode support
  - Tag management system

## Documentation

For developers working on this project, we maintain comprehensive documentation:

- [Refactoring Documentation Index](/docs/refactoring-documentation-index.md) - Central hub for all refactoring documentation
- [Consolidated Refactoring Strategy](/docs/refactoring-strategy-consolidated.md) - Overview of our component and schema migration strategy
- [Component Refactoring Progress](/docs/component-refactoring-progress.md) - Current status of the refactoring effort
- [Component Migrations History](/docs/component-migrations-history.md) - Historical record of completed component migrations

## Tech Stack

- Next.js 15.3 (App Router)
- TypeScript
- Prisma (Database ORM)
- NextAuth.js (Authentication)
- Tailwind CSS (Styling)

## Getting Started

First, make sure you have set up your environment variables in a `.env` file:

```env
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Then, install dependencies and set up the database:

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app` - Next.js app router pages and API routes
  - `/app/api` - Backend API endpoints
  - `/app/galleries` - Gallery-related pages
  - `/app/images` - Image management pages
  - `/app/auth` - Authentication pages
- `/src/components` - Reusable React components
  - Gallery components (GalleryGrid, GalleryView, etc.)
  - Image components (ImageGrid, ImageCarousel, etc.)
  - Dialog components for editing and confirmation
- `/src/lib` - Utility functions and configurations
- `/prisma` - Database schema and migrations
- `/public` - Static files and uploaded images
  - `/public/uploads` - User-uploaded images

## API Routes

- `/api/auth/*` - Authentication endpoints powered by NextAuth.js
- `/api/galleries` - Gallery creation and listing
  - `/api/galleries/[id]` - Single gallery operations (get, update, delete)
- `/api/images` - Image listing and management
  - `/api/images/[id]` - Single image operations
  - `/api/images/[id]/usage` - Image usage information
- `/api/upload` - File upload handling

## Deployment

You can deploy this application to any platform that supports Next.js applications, such as Vercel or Netlify:

1. Connect your repository to your chosen deployment platform
2. Configure environment variables in the platform's dashboard
3. Deploy the application

For production deployment, make sure to set up a production database and configure the correct environment variables.

## Database Schema

The application uses Prisma with migrations to manage the database schema. Key entities include:

- Users
- Galleries (with cover image support)
- Images (with ordering capability)
- Tags

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
