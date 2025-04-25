'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to Art Gallery
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Share your artwork, create curated galleries, and connect with other artists.
        </p>

        {session ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Manage Your Images</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Upload and organize your artwork with titles, descriptions, and tags.
                </p>
                <Link
                  href="/images"
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Go to Images
                </Link>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Create Galleries</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Curate your artwork into themed collections and share them with others.
                </p>
                <Link
                  href="/galleries"
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Go to Galleries
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to start uploading your artwork and creating galleries.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
