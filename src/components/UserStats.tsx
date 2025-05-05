'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { UserRole } from '@/lib/types';

interface UserStatsProps {
  imageCount: number;
  galleryCount: number;
  memberSince: Date | null;
  role?: UserRole;
}

export function UserStats({ imageCount, galleryCount, memberSince, role = UserRole.USER }: UserStatsProps) {
  return (
    <div className="space-y-4">
      {role === UserRole.ADMIN && (
        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-3 py-2 rounded-md border border-purple-200 dark:border-purple-800/50 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Administrator
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {imageCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {imageCount === 1 ? 'Image' : 'Images'}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {galleryCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {galleryCount === 1 ? 'Gallery' : 'Galleries'}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member Since</h3>
        <p className="font-medium">
          {memberSince ? (
            <>
              {format(memberSince, 'PP')}
              <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatDistanceToNow(memberSince, { addSuffix: true })}
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              Not available
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
