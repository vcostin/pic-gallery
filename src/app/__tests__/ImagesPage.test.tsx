// filepath: /Users/vcostin/Work/pic-gallery/src/app/__tests__/ImagesPage.test.tsx
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ImagesPage from "@/app/images/page";
import { useRouter, useSearchParams } from "next/navigation";
import * as schemas from "@/lib/schemas";
import { z } from "zod";
import { ImageService } from "@/lib/services/imageService";

// Mock Next.js router and searchParams
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the ImageService
jest.mock("@/lib/services/imageService", () => ({
  ImageService: {
    getImages: jest.fn()
  }
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

// Create a custom mock for fetch (needed for backward compatibility)
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
    refresh: jest.fn()
  };
  
  // Mock URL search params
  const mockGetParam = jest.fn();
  const mockSearchParamsToString = jest.fn().mockReturnValue("");
  
  // Mock for ImageService.getImages
  const mockGetImages = ImageService.getImages as jest.MockedFunction<typeof ImageService.getImages>;
  
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
    
    // Setup ImageService mock
    mockGetImages.mockResolvedValue({
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
    
    // Verify ImageService was called
    expect(mockGetImages).toHaveBeenCalledWith(
      { page: 1, searchQuery: "", tag: "" },
      expect.any(AbortSignal)
    );
    
    // Verify page elements
    expect(screen.getByText("My Images")).toBeInTheDocument();
    expect(screen.getByText("Upload New Image")).toBeInTheDocument();
    
    // Verify images are rendered using the mocked ImageGrid component
    const imageGrid = screen.getByTestId("image-grid");
    expect(imageGrid).toBeInTheDocument();
    
    // Verify pagination is rendered
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
  });

  test("handles search query input with debounce", async () => {
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Clear previous ImageService calls
    mockGetImages.mockClear();
    
    // Mock the ImageService for search results
    mockGetImages.mockResolvedValue({
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
    });
    
    // Type in search box to trigger debounced API call
    const searchInput = screen.getByPlaceholderText("e.g., Sunset, Mountains");
    fireEvent.change(searchInput, { target: { value: "landscape" } });
    
    // Mock the global setTimeout to execute immediately
    jest.useFakeTimers();
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
    
    // Wait for the API call to complete after timer runs
    await waitFor(() => {
      expect(mockGetImages).toHaveBeenCalledWith(
        expect.objectContaining({
          searchQuery: "landscape",
          page: 1
        }),
        expect.any(AbortSignal)
      );
    }, { timeout: 1000 });
  });

  test("handles tag filter input with debounce", async () => {
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Clear previous ImageService calls
    mockGetImages.mockClear();
    
    // Mock the ImageService for tag filter results
    mockGetImages.mockResolvedValue({
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
    });
    
    // Type in tag filter
    const tagInput = screen.getByPlaceholderText("e.g., nature, portrait");
    fireEvent.change(tagInput, { target: { value: "nature" } });
    
    // Fast-forward timers to trigger the debounced function
    jest.useFakeTimers();
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockGetImages).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: "nature",
          page: 1
        }),
        expect.any(AbortSignal)
      );
    });
  });

  test("handles pagination properly", async () => {
    render(<ImagesPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Mock response for page 2
    mockGetImages.mockClear();
    mockGetImages.mockResolvedValue({
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
    });
    
    // Click next page button
    const nextButton = screen.getByTestId("next-page-button");
    fireEvent.click(nextButton);
    
    // Wait for the API call with page=2
    await waitFor(() => {
      expect(mockGetImages).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        }),
        expect.any(AbortSignal)
      );
    });
    
    // Verify router was updated
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      expect.anything()
    );
  });

  test("handles API errors correctly", async () => {
    // Mock the ImageService to throw an error
    mockGetImages.mockRejectedValue(new Error("Failed to fetch images"));
    
    render(<ImagesPage />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch images")).toBeInTheDocument();
    });
    
    // Check for retry button functionality
    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Setup success response for retry
    mockGetImages.mockResolvedValue({
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
    });
    
    // Click retry
    fireEvent.click(retryButton);
    
    // Verify ImageService was called again
    await waitFor(() => {
      expect(mockGetImages).toHaveBeenCalledTimes(2);
    });
  });

  test("shows empty state when no images are found", async () => {
    // Mock the ImageService to return empty array
    mockGetImages.mockResolvedValue({
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
    });
    
    render(<ImagesPage />);
    
    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText("No Images Found")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Try adjusting your filters or upload new images.")).toBeInTheDocument();
  });

  test("handles URL search params on initial load", async () => {
    // Mock URL search params with existing query
    mockGetParam.mockImplementation((param) => {
      if (param === "page") return "2";
      if (param === "searchQuery") return "landscape";
      if (param === "tag") return "nature";
      return null;
    });
    
    mockGetImages.mockClear();
    
    render(<ImagesPage />);
    
    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText("Fetching images...")).not.toBeInTheDocument();
    });
    
    // Verify ImageService was called with proper parameters
    expect(mockGetImages).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        searchQuery: "landscape",
        tag: "nature"
      }),
      expect.any(AbortSignal)
    );
    
    // Verify search input has the right value
    const searchInput = screen.getByPlaceholderText("e.g., Sunset, Mountains");
    expect(searchInput).toHaveValue("landscape");
    
    // Verify tag input has the right value
    const tagInput = screen.getByPlaceholderText("e.g., nature, portrait");
    expect(tagInput).toHaveValue("nature");
  });
});
