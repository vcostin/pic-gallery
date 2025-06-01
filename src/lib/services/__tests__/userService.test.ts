import { UserService, type User } from '@/lib/services/userService';
import { fetchApi } from '@/lib/apiUtils';

// Mock the fetchApi function
jest.mock('@/lib/apiUtils', () => ({
  fetchApi: jest.fn()
}));

// Mock for fetchApi implementation
const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

// Sample test data
const mockUser: User = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'USER',
  image: 'https://example.com/avatar.jpg',
  emailVerified: new Date(),
};

const mockPaginatedUsers = {
  data: [mockUser],
  meta: {
    total: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  }
};

describe('UserService', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetchApi.mockReset();
    
    // Default mock implementation for fetchApi
    mockFetchApi.mockImplementation(async (url: string) => {
      if (url.startsWith('/api/users?') || url === '/api/users') {
        return mockPaginatedUsers;
      } else if (url === '/api/users/user1') {
        return mockUser;
      } else if (url === '/api/users/me') {
        return mockUser;
      }
      return mockUser;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get users with pagination', async () => {
    // Override mockFetchApi for this test
    mockFetchApi.mockResolvedValueOnce({
      success: true,
      data: mockPaginatedUsers
    });
    
    const result = await UserService.getUsers();
    
    expect(mockFetchApi).toHaveBeenCalledWith('/api/users', { signal: undefined }, expect.any(Object));
    expect(result).toBeDefined();
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
  
  it('should get users with search parameters', async () => {
    await UserService.getUsers({
      searchQuery: 'test',
      role: 'ADMIN', 
      page: 2, 
      limit: 20
    });
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/users?searchQuery=test&page=2&limit=20&role=ADMIN',
      { signal: undefined },
      expect.any(Object)
    );
  });

  it('should get a single user by ID', async () => {
    const result = await UserService.getUser('user1');
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/users/user1',
      { signal: undefined },
      expect.any(Object)
    );
    expect(result).toEqual(mockUser);
  });

  it('should get the current user', async () => {
    const result = await UserService.getCurrentUser();
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/users/me',
      { signal: undefined },
      expect.any(Object)
    );
    expect(result).toEqual(mockUser);
  });

  it('should update user profile', async () => {
    const profileData = {
      name: 'Updated Name',
      image: 'https://example.com/new-avatar.jpg'
    };
    
    await UserService.updateProfile(profileData);
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/users/me',
      {
        method: 'PATCH',
        body: JSON.stringify(profileData),
        signal: undefined
      },
      expect.any(Object)
    );
  });

  it('should update a user role', async () => {
    await UserService.updateUserRole('user1', 'ADMIN');
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/users/user1/role',
      {
        method: 'PUT',
        body: JSON.stringify({ role: 'ADMIN' }),
        signal: undefined
      },
      expect.any(Object)
    );
  });

  describe('error handling', () => {
    it('should throw an error when updating profile with invalid data', async () => {
      // Prepare invalid data (empty name)
      const invalidProfileData = {
        name: ''
      };
      
      // Expect validation error
      await expect(UserService.updateProfile(invalidProfileData))
        .rejects
        .toThrow();
      
      // Verify fetchApi was not called
      expect(mockFetchApi).not.toHaveBeenCalled();
    });
    
    it('should throw an error when updating user role with invalid role', async () => {
      // Expect validation error with empty role
      await expect(UserService.updateUserRole('user1', ''))
        .rejects
        .toThrow();
      
      // Verify fetchApi was not called
      expect(mockFetchApi).not.toHaveBeenCalled();
    });
    
    it('should propagate API errors from fetchApi', async () => {
      // Mock fetchApi to throw an error
      mockFetchApi.mockRejectedValueOnce(new Error('API error'));
      
      // Expect the error to be propagated
      await expect(UserService.getUser('user1'))
        .rejects
        .toThrow('API error');
    });
  });

  describe('with AbortController', () => {
    it('should pass AbortSignal to fetch requests', async () => {
      const controller = new AbortController();
      const signal = controller.signal;
      
      await UserService.getUsers({}, signal);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/api/users',
        { signal },
        expect.any(Object)
      );
      
      await UserService.getUser('user1', signal);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/api/users/user1',
        { signal },
        expect.any(Object)
      );
      
      await UserService.getCurrentUser(signal);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/api/users/me',
        { signal },
        expect.any(Object)
      );
    });
    
    it('should handle aborted requests', async () => {
      // Create controller and abort it
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Mock the abort error
      mockFetchApi.mockImplementationOnce(() => {
        throw new DOMException('The operation was aborted', 'AbortError');
      });
      
      // Expect abort error to be propagated
      await expect(UserService.getCurrentUser(signal))
        .rejects
        .toThrow('The operation was aborted');
    });
  });
});
