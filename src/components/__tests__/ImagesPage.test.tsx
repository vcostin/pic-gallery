import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ImagesPage from "@/app/images/page";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageService } from "@/lib/services/imageService";
import * as schemas from "@/lib/schemas";
import { z } from "zod";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock ImageService
jest.mock("@/lib/services/imageService", () => ({
  ImageService: {
    getImages: jest.fn(),
  },
}));

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

// Create a custom mock for fetch to prevent real network requests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create a mock for AbortController
const mockAbort = jest.fn();
const originalAbortController = global.AbortController;
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: { aborted: false },
  abort: mockAbort,
}));

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

// Prepare alternative responses for different test scenarios
const mockEmptyResponse = {
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
};

const mockPage2Response = {
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
  
  // Set up fake timers for all tests
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
    global.AbortController = originalAbortController;
  });
  
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
    
    // Setup default fetch mock to return success for ALL tests
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse
    });

    // Reset abort mock
    mockAbort.mockClear();
  });
  
  afterEach(() => {
    // Clean up any running timers
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
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
    expect(screen.getByTestId("page-info")).toHaveTextContent("Page 1 of 2");
  });

  test("handles search query input with debounce", async () => {
    // Set up search response
    const searchResponse = {
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
    };

    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Clear previous fetch calls
    mockFetch.mockClear();
    
    // Set up the mock for search results
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => searchResponse
    });
    
    // Type in search box
    const searchInput = screen.getByTestId("search-input");
    
    act(() => {
      fireEvent.change(searchInput, { target: { value: "landscape" } });
    });
    
    // Verify no immediate API call
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Fast-forward debounce timer
    act(() => {
      jest.advanceTimersByTime(500); // Advance by debounce delay
    });
    
    // Verify the fetch was called with search params after debounce
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("searchQuery=landscape"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        }),
        signal: expect.any(Object)
      })
    );

    // Wait for UI to update with search results
    await waitFor(() => {
      expect(screen.getByTestId("image-grid")).toBeInTheDocument();
    });
  });

  test("handles tag filter input with debounce", async () => {
    // Set up tag filter response
    const tagFilterResponse = {
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
    };

    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
      expect(screen.getByTestId("image-grid")).toBeInTheDocument();
    });
    
    // Clear previous fetch calls
    mockFetch.mockClear();
    
    // Set up the mock for tag filter response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => tagFilterResponse
    });
    
    // Type in tag filter input
    const tagInput = screen.getByTestId("tag-input");
    
    act(() => {
      fireEvent.change(tagInput, { target: { value: "nature" } });
    });
    
    // Verify no immediate API call
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Fast-forward debounce timer
    act(() => {
      jest.advanceTimersByTime(500); // Advance by debounce delay
    });
    
    // Allow microtasks to execute (this runs any pending promises after timer executes)
    await Promise.resolve();
    
    // Now directly verify the fetch was called with tag params without using waitFor
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("tag=nature"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        }),
        signal: expect.any(Object)
      })
    );
    
    // Wait for UI to update with filtered results
    await waitFor(() => {
      expect(screen.getByTestId("image-grid")).toBeInTheDocument();
    });
  });

  test("handles pagination properly", async () => {
    render(<ImagesPage />);
    
    // Wait for initial data to load and image grid to appear
    await waitFor(() => {
      expect(screen.getByTestId("image-grid")).toBeInTheDocument();
    });
    
    // Verify pagination is shown from the mock data
    expect(screen.getByTestId("page-info")).toHaveTextContent("Page 1 of 2");
    
    // Reset the fetch mock for the next page request
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPage2Response
    });
    
    // Click on Next button
    act(() => {
      fireEvent.click(screen.getByText("Next"));
    });
    
    // Wait for page 2 data to be loaded
    await waitFor(() => {
      expect(screen.getByTestId("page-info")).toHaveTextContent("Page 2 of 2");
    });
    
    // Verify fetch was called with page=2
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      expect.anything()
    );
    
    // Verify router was called with updated URL
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringMatching(/\/images\?.*page=2/),
      expect.anything()
    );
  });

  test("handles API errors correctly", async () => {
    // Set up error response for initial load
    mockFetch.mockRejectedValue(new Error("Failed to fetch images"));
    
    render(<ImagesPage />);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch images/i)).toBeInTheDocument();
    });
    
    // Verify retry button exists
    const retryButton = screen.getByText("Try again");
    expect(retryButton).toBeInTheDocument();
    
    // Set up success for the retry
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse
    });
    
    // Click the retry button
    act(() => {
      fireEvent.click(retryButton);
    });
    
    // Verify loading state appears
    expect(screen.getByText("Fetching images...")).toBeInTheDocument();
    
    // Wait for success state with image grid
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
      expect(screen.getByTestId("image-grid")).toBeInTheDocument();
    });
  });

  test("shows empty state when no images are found", async () => {
    // Set up empty response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockEmptyResponse
    });
    
    render(<ImagesPage />);
    
    // Verify loading state appears initially
    expect(screen.getByText("Fetching images...")).toBeInTheDocument();
    
    // Wait for empty state to appear
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });
    
    // Verify empty state messages
    expect(screen.getByText("No Images Found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters or upload new images.")).toBeInTheDocument();
  });

  test("aborts previous requests when making new ones", async () => {
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Clear previous calls
    mockFetch.mockClear();
    mockAbort.mockClear();
    
    // Make multiple search input changes in quick succession
    const searchInput = screen.getByTestId("search-input");
    
    // First change
    act(() => {
      fireEvent.change(searchInput, { target: { value: "a" } });
    });
    
    // Let debounce timer start but don't finish
    act(() => {
      jest.advanceTimersByTime(200); // Advance timer partially
    });
    
    // Second change - should abort first request's debounce
    act(() => {
      fireEvent.change(searchInput, { target: { value: "ab" } });
    });
    
    // Fast-forward to trigger the API call for "ab"
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Third change - should abort previous request
    act(() => {
      fireEvent.change(searchInput, { target: { value: "abc" } });
    });
    
    // Fast-forward to trigger the final API call
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Verify abort was called at least once
    await waitFor(() => {
      expect(mockAbort).toHaveBeenCalled();
    });
    
    // Verify the final fetch has correct search term
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("searchQuery=abc"),
        expect.anything()
      );
    });
  });

  test("handles URL search params on initial load", async () => {
    // Mock URL search params with existing query
    mockGetParam.mockImplementation((param) => {
      if (param === "page") return "2";
      if (param === "searchQuery") return "landscape";
      if (param === "tag") return "nature";
      return null;
    });
    
    render(<ImagesPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Verify fetch was called with the right URL params
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/.*page=2.*/),
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
    
    // Verify input fields have correct values
    const searchInput = screen.getByTestId("search-input");
    expect(searchInput).toHaveValue("landscape");
    
    const tagInput = screen.getByTestId("tag-input");
    expect(tagInput).toHaveValue("nature");
  });
});
