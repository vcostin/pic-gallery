/**
 * User service for interacting with the user API
 * Using Zod schemas for validation
 */
import { z } from 'zod';
import { fetchApi } from '../apiUtils';
import { 
  UserSchema,
  PaginatedUsersResponseSchema
} from '../schemas';

// Type definitions derived from schemas
export type User = z.infer<typeof UserSchema>;
export type PaginatedUsers = z.infer<typeof PaginatedUsersResponseSchema>['data'];

/**
 * Service for interacting with the user API
 */
export const UserService = {
  /**
   * Get all users with optional filtering and pagination
   * @param params Search and pagination parameters
   */
  async getUsers(params?: { 
    searchQuery?: string;
    page?: number;
    limit?: number;
    role?: string;
  }, signal?: AbortSignal): Promise<PaginatedUsers> {
    const queryParams = new URLSearchParams();
    if (params?.searchQuery) queryParams.set('searchQuery', params.searchQuery);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.role) queryParams.set('role', params.role);

    const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return fetchApi(url, { signal }, PaginatedUsersResponseSchema).then(response => response.data);
  },

  /**
   * Get a user by ID
   */
  async getUser(id: string, signal?: AbortSignal): Promise<User> {
    return fetchApi(`/api/users/${id}`, { signal }, UserSchema);
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(signal?: AbortSignal): Promise<User> {
    return fetchApi('/api/users/me', { signal }, UserSchema);
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(
    profileData: { name?: string; image?: string },
    signal?: AbortSignal
  ): Promise<User> {
    // Validate input data
    const profileSchema = z.object({
      name: z.string().min(1).optional(),
      image: z.string().optional()
    });

    profileSchema.parse(profileData);

    return fetchApi('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
      signal
    }, UserSchema);
  },

  /**
   * Update a user's role (admin only)
   */
  async updateUserRole(
    userId: string, 
    role: string, 
    signal?: AbortSignal
  ): Promise<User> {
    // Validate role
    z.string().min(1).parse(role);

    return fetchApi(`/api/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
      signal
    }, UserSchema);
  }
};
