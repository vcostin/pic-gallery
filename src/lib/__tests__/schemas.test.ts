/**
 * Unit tests for schemas.ts
 * Focus on testing the preprocessing logic in FlexibleImagesResponseSchema
 */
import { 
  FlexibleImagesResponseSchema
} from '@/lib/schemas';

describe('FlexibleImagesResponseSchema', () => {
  // Sample image data for tests
  const sampleImage = {
    id: '1',
    title: 'Test Image',
    description: 'A test image',
    url: 'https://example.com/image.jpg',
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: []
  };

  // Sample pagination metadata
  const sampleMeta = {
    total: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  };

  describe('handling direct array format', () => {
    it('should transform direct array into standard format with default pagination', () => {
      // Arrange: A direct array response from API
      const directArrayResponse = [sampleImage];
      
      // Act: Parse with flexible schema
      const result = FlexibleImagesResponseSchema.parse(directArrayResponse);
      
      // Assert: Should be transformed to standard format with defaults
      expect(result.success).toBe(true);
      expect(result.data.data).toEqual(directArrayResponse);
      expect(result.data.meta).toEqual({
        total: 1,
        currentPage: 1,
        lastPage: 1,
        perPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      });
    });

    it('should handle empty array', () => {
      // Arrange: An empty array response
      const emptyArrayResponse: unknown[] = [];
      
      // Act: Parse with flexible schema
      const result = FlexibleImagesResponseSchema.parse(emptyArrayResponse);
      
      // Assert: Should handle empty array correctly
      expect(result.success).toBe(true);
      expect(result.data.data).toEqual([]);
      expect(result.data.meta.total).toBe(0);
      expect(result.data.meta.perPage).toBe(1); // perPage should be at least 1
    });
  });

  describe('handling object with data and meta format', () => {
    it('should transform object with data and meta into standard format', () => {
      // Arrange: Response with data and meta but no success field
      const dataMetaResponse = {
        data: [sampleImage],
        meta: sampleMeta
      };
      
      // Act: Parse with flexible schema
      const result = FlexibleImagesResponseSchema.parse(dataMetaResponse);
      
      // Assert: Success field should be added
      expect(result.success).toBe(true);
      expect(result.data).toEqual(dataMetaResponse);
    });
  });

  describe('handling standard format', () => {
    it('should pass through standard format unchanged', () => {
      // Arrange: Standard format response
      const standardResponse = {
        success: true,
        data: {
          data: [sampleImage],
          meta: sampleMeta
        }
      };
      
      // Act: Parse with flexible schema
      const result = FlexibleImagesResponseSchema.parse(standardResponse);
      
      // Assert: Should be unchanged
      expect(result).toEqual(standardResponse);
    });
  });

  describe('validation', () => {
    it('should validate transformed data against schema', () => {
      // Arrange: Invalid image in array (missing required title)
      const invalidImage = { ...sampleImage, title: undefined };
      const invalidResponse = [invalidImage];
      
      // Act & Assert: Should throw validation error
      expect(() => {
        FlexibleImagesResponseSchema.parse(invalidResponse);
      }).toThrow();
    });

    it('should validate data and meta structure after transformation', () => {
      // Arrange: Invalid meta in data/meta format (missing required fields)
      const invalidDataMeta = {
        data: [sampleImage],
        meta: { total: 1 } // missing required fields
      };
      
      // Act & Assert: Should throw validation error
      expect(() => {
        FlexibleImagesResponseSchema.parse(invalidDataMeta);
      }).toThrow();
    });
    
    it('should reject null values', () => {
      expect(() => {
        FlexibleImagesResponseSchema.parse(null);
      }).toThrow();
    });
    
    it('should reject undefined values', () => {
      expect(() => {
        FlexibleImagesResponseSchema.parse(undefined);
      }).toThrow();
    });
  });
  
  describe('edge cases', () => {
    it('should handle objects that are neither arrays nor have data/meta structure', () => {
      // Arrange: Object without proper structure
      const randomObject = { foo: 'bar' };
      
      // Act & Assert: Should throw validation error
      expect(() => {
        FlexibleImagesResponseSchema.parse(randomObject);
      }).toThrow();
    });
    
    it('should handle objects with data property that is not an array', () => {
      // Arrange: Object with wrong data type
      const invalidDataType = {
        data: 'not an array',
        meta: sampleMeta
      };
      
      // Act & Assert: Should throw validation error
      expect(() => {
        FlexibleImagesResponseSchema.parse(invalidDataType);
      }).toThrow();
    });
  });
});
