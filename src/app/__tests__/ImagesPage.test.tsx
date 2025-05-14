import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ImagesPage from "@/app/images/page";
import { useRouter, useSearchParams } from "next/navigation";
import * as schemas from "@/lib/schemas";
import { z } from "zod";

// Mock Next.js router and searchParams
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the ImageGrid component
jest.mock("@/components/ImageGrid", () => ({
  ImageGrid: ({ images }) => (
    <div data-testid="image-grid">
      {images.map((img) => (
        <div key={img.id} data-testid="image-item">
          <h3>{img.title}</h3>
          <p>{img.description}</p>
        </div>
      ))}
    </div>
  ),
}));

// Create a custom mock for fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Setup mock data
const mockImages = [
  {
    id: "img1",
    title: "Test Image 1",
    description: "Description for test image 1",
    url: "https://example.com/image1.jpg",
    userId: "user1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [
      { id: "tag1", name: "nature" },
      { id: "tag2", name: "sunset" },
    ],
  },
  {
    id: "img2",
    title: "Test Image 2",
    description: null,
    url: "https://example.com/image2.jpg",
    userId: "user1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [
      { id: "tag3", name: "portrait" },
    ],
  },
];

// Mock successful API response
const mockSuccessResponse = {
  success: true,
  data: {
    data: mockImages,
    meta: {
      total: 10,
      currentPage: 1,
      lastPage: 2,
      perPage: 8,
      hasNextPage: true,
      hasPrevPage: false,
      nextPage: 2,
      prevPage: null,
    },
  },
};

// Mock validation function with proper typing
jest.spyOn(schemas.PaginatedImagesResponseSchema, "parse").mockImplementation((data) => {
  return data as z.infer<typeof schemas.PaginatedImagesResponseSchema>;
});

describe("ImagesPage", () => {
  const mockRouter = {
    replace: jest.fn(),
  };
  
  // Mock URL search params
  const mockGetParam = jest.fn();
  const mockSearchParamsToString = jest.fn().mockReturnValue("");
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks for router and searchParams
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    mockGetParam.mockImplementation((param) => {
      if (param === "page") return "1";
      if (param === "searchQuery") return "";
      if (param === "tag") return "";
      return null;
    });
    
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGetParam,
      toString: mockSearchParamsToString,
    });
    
    // Setup default fetch mock to return success
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders the component with initial data", async () => {
    render(<ImagesPage />);
    
    // Verify loading state is shown
    expect(screen.getByText("Fetching images...")).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Verify page elements
    expect(screen.getByText("My Images")).toBeInTheDocument();
    expect(screen.getByText("Upload New Image")).toBeInTheDocument();
    
    // Verify images are rendered using the mocked ImageGrid component
    const imageGrid = screen.getByTestId("image-grid");
    expect(imageGrid).toBeInTheDocument();
    
    // Verify pagination is rendered
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
  });

  test("handles search query input", async () => {
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Set up a new mock for the search query
    mockFetch.mockClear(); // Clear previous fetch calls
    
    // Mock the fetch for search results before typing
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: [mockImages[0]],
          meta: {
            total: 1,
            currentPage: 1,
            lastPage: 1,
            perPage: 8,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
          },
        },
      }),
    });
    
    // Type in search box to trigger debounced API call
    const searchInput = screen.getByPlaceholderText("e.g., Sunset, Mountains");
    fireEvent.change(searchInput, { target: { value: "landscape" } });
    
    // Mock the global setTimeout to execute immediately
    jest.useFakeTimers();
    jest.runAllTimers(); 
    jest.useRealTimers();
    
    // Wait for the API call to complete after timer runs
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("searchQuery=landscape"),
        expect.anything()
      );
    }, { timeout: 1000 });
    
    // Verify the fetch was called with search params
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("searchQuery=landscape"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        }),
        signal: expect.any(AbortSignal)
      })
    );
  });

  test("handles tag filter input", async () => {
    // Reset the mocks
    mockFetch.mockClear();
    mockFetch.mockImplementation(async (url) => {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            data: url.includes("tag=nature") ? [mockImages[0]] : mockImages,
            meta: {
              total: url.includes("tag=nature") ? 1 : 2,
              currentPage: 1,
              lastPage: 1,
              perPage: 8,
              hasNextPage: false,
              hasPrevPage: false,
              nextPage: null,
              prevPage: null,
            },
          },
        })
      };
    });
    
    // Setup fake timers for debounce control
    jest.useFakeTimers();
    
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Clear fetch calls after initial load
    mockFetch.mockClear();
    
    // Type in tag filter
    const tagInput = screen.getByPlaceholderText("e.g., nature, portrait");
    fireEvent.change(tagInput, { target: { value: "nature" } });
    
    // Fast-forward timers to trigger the debounced function
    act(() => {
      jest.runAllTimers();
    });
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Get the most recent call and check if it includes the tag parameter
    const mostRecentCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    expect(mostRecentCall[0]).toContain("tag=nature");
    
    // Cleanup
    jest.useRealTimers();
  });
  });

  test.skip("handles pagination", async () => {
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Note: Pagination UI is not implemented yet
    // This test will be updated when pagination UI is added
    
    // Mock the fetch for page 2
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: mockImages,
          meta: {
            total: 10,
            currentPage: 2,
            lastPage: 2,
            perPage: 8,
            hasNextPage: false,
            hasPrevPage: true,
            nextPage: null,
            prevPage: 1,
          },
        },
      }),
    });
    
    // Wait for fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining("page=2"),
        expect.anything()
      );
    });
    
    // Verify router was called with updated URL
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  test("handles API errors", async () => {
    // Mock fetch to return error
    mockFetch.mockRejectedValue(new Error("Failed to fetch images"));
    
    render(<ImagesPage />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch images")).toBeInTheDocument();
    });
    
    // Check for retry button (which has text "Try again")
    const retryButton = screen.getByText("Try again");
    expect(retryButton).toBeInTheDocument();
    
    // Setup success response for retry
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });
    
    // Click retry
    fireEvent.click(retryButton);
    
    // Verify loading state is shown again
    expect(screen.getByText("Fetching images...")).toBeInTheDocument();
    
    // Wait for data to load after retry
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Verify content is shown
    expect(screen.getByText("Test Image 1")).toBeInTheDocument();
  });

  test("shows empty state when no images are found", async () => {
    // Mock fetch to return empty array
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: [],
          meta: {
            total: 0,
            currentPage: 1,
            lastPage: 1,
            perPage: 8,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
          },
        },
      }),
    });
    
    render(<ImagesPage />);
    
    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText("No Images Found")).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your filters or upload new images.")).toBeInTheDocument();
    });
  });

  test("aborts previous requests when making new ones", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Trigger multiple searches in quick succession
    const searchInput = screen.getByPlaceholderText("e.g., Sunset, Mountains");
    fireEvent.change(searchInput, { target: { value: "a" } });
    fireEvent.change(searchInput, { target: { value: "ab" } });
    fireEvent.change(searchInput, { target: { value: "abc" } });
    
    // Verify abort was called at least once
    await waitFor(() => {
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  test.skip("handles URL search params on initial load", async () => {
    // Mock URL search params with existing query
    const mockGet = jest.fn((param) => {
      if (param === "page") return "2";
      if (param === "searchQuery") return "landscape";
      if (param === "tag") return "nature";
      return null;
    });
    
    render(<ImagesPage />);
    
    // Verify fetch was called with the right params
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("searchQuery=landscape"),
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("tag=nature"),
      expect.anything()
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Verify search input has the right value
    const searchInput = screen.getByPlaceholderText("e.g., Sunset, Mountains");
    expect(searchInput).toHaveValue("landscape");
    
    // Verify tag input has the right value
    const tagInput = screen.getByPlaceholderText("e.g., nature, portrait");
    expect(tagInput).toHaveValue("nature");
  });
