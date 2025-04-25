# Picture Gallery

A modern image gallery application built with Next.js that allows users to manage and share their photo collections.

## Features

- **User Authentication**: Secure sign-in functionality
- **Image Upload**: Upload and manage your images with titles, descriptions, and tags
- **Gallery Management**: Create and organize galleries with multiple images
- **Privacy Controls**: Set galleries as public or private
- **Interactive UI**: 
  - Responsive image grid layouts
  - Image carousel for viewing
  - Dark mode support
  - Tag management system

## Tech Stack

- Next.js 14 (App Router)
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
npx prisma db push
```

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and configurations
- `/prisma` - Database schema and migrations
- `/public` - Static files and uploaded images

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/galleries` - Gallery management
- `/api/images` - Image management
- `/api/upload` - File upload handling

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
