'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { UserRole } from '@prisma/client';

// Define the User type
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
  _count: {
    images: number;
    galleries: number;
  };
}

// Define pagination type
interface Pagination {
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current page from URL or default to 1
  const currentPage = searchParams.get('page') ? 
    parseInt(searchParams.get('page')!) : 1;
  
  // Get search term from URL
  const urlSearchTerm = searchParams.get('search') || '';

  // Fetch users whenever page or search changes
  useEffect(() => {
    setIsLoading(true);
    setSearchTerm(urlSearchTerm);
    
    const fetchUsers = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10'
        });
        
        if (urlSearchTerm) {
          queryParams.append('search', urlSearchTerm);
        }
        
        const response = await fetch(`/api/users?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        // Expect only { data: { data: [...] } } API response
        setUsers(Array.isArray(data.data?.data) ? data.data.data : []);
        setPagination(data.data?.meta || {});
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentPage, urlSearchTerm]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    params.set('page', '1'); // Reset to first page on new search
    
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    
    router.push(`/admin/users?${params.toString()}`);
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refresh the user list
      setUsers(users.filter(user => user.id !== userId));
      setPagination({
        ...pagination,
        totalUsers: pagination.totalUsers - 1
      });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`);
    }
  };

  // Handle admin role toggle
  const handleToggleRole = async (userId: string, currentRole: UserRole) => {
    try {
      const newRole = currentRole === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
      
      const response = await fetch(`/api/users/${userId}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      // Refresh the user list
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`);
    }
  };
  
  // Generate pagination links
  const generatePaginationLinks = () => {
    const links = [];
    const maxLinks = 5; // Max number of links to show
    
    let startPage = Math.max(1, currentPage - Math.floor(maxLinks / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxLinks - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxLinks) {
      startPage = Math.max(1, endPage - maxLinks + 1);
    }
    
    // Previous button
    links.push(
      <li key="prev">
        <button
          onClick={() => goToPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border disabled:opacity-50"
          aria-label="Previous page"
        >
          &laquo;
        </button>
      </li>
    );
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <li key={i}>
          <button
            onClick={() => goToPage(i)}
            className={`px-3 py-1 rounded-md ${
              i === currentPage 
                ? 'bg-blue-600 text-white' 
                : 'border hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {i}
          </button>
        </li>
      );
    }
    
    // Next button
    links.push(
      <li key="next">
        <button
          onClick={() => goToPage(Math.min(pagination.totalPages, currentPage + 1))}
          disabled={currentPage === pagination.totalPages}
          className="px-3 py-1 rounded-md border disabled:opacity-50"
          aria-label="Next page"
        >
          &raquo;
        </button>
      </li>
    );
    
    return links;
  };
  
  // Navigate to a specific page
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
        ]}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        
        {/* Search Form */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="flex-grow px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-left">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Images</th>
                <th className="px-4 py-3">Galleries</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <p>No users found</p>
                    {urlSearchTerm && (
                      <p className="mt-2">
                        <Link href="/admin/users" className="text-blue-600 hover:underline">
                          Clear search
                        </Link>
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || 'User'}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400">
                                {(user.name || user.email || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{user.email || 'No email'}</td>
                    <td className="px-4 py-3">{user._count.images}</td>
                    <td className="px-4 py-3">{user._count.galleries}</td>
                    <td className="px-4 py-3">
                      {user.role === UserRole.ADMIN ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Link
                          href={`/profile/${user.id}`}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/40 transition"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className={`px-2 py-1 rounded-md transition ${
                            user.role === UserRole.ADMIN
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/40'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40'
                          }`}
                        >
                          {user.role === UserRole.ADMIN ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/40 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} 
              to {Math.min(pagination.page * pagination.limit, pagination.totalUsers)} 
              of {pagination.totalUsers} users
            </div>
            <ul className="flex space-x-2">
              {generatePaginationLinks()}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
