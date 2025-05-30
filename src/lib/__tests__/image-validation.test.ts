import { SelectableImageSchema, mapToSelectableImage } from '@/lib/utils/imageSelectionMappers';
import { ImageSchema } from '@/lib/schemas';

describe('Image Validation Tests', () => {
  
  describe('SelectableImageSchema', () => {
    it('should validate complete image objects correctly', () => {
      const validImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ id: 'tag-1', name: 'test' }]
      };
      
      const result = SelectableImageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
    });
    
    it('should validate image objects without tags', () => {
      const validImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = SelectableImageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
    });
    
    it('should reject image objects without required fields', () => {
      // Missing userId - should fail
      const incompleteImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ id: 'tag-1', name: 'test' }]
      };
      
      const result = SelectableImageSchema.safeParse(incompleteImage);
      expect(result.success).toBe(false);
      
      let invalidImage = {
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg'
      };
      
      let validationResult = SelectableImageSchema.safeParse(invalidImage);
      expect(validationResult.success).toBe(false);
      
      // Missing title
      invalidImage = {
        description: 'A test image',
        url: '/test.jpg'
      };
      
      validationResult = SelectableImageSchema.safeParse(invalidImage);
      expect(validationResult.success).toBe(false);
      
      // Missing url
      invalidImage = {
        title: 'Test Image',
        description: 'A test image'
      };
      
      validationResult = SelectableImageSchema.safeParse(invalidImage);
      expect(validationResult.success).toBe(false);
    });
  });
  
  describe('mapToSelectableImage', () => {
    it('should correctly map a complete image object', () => {
      const completeImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ id: 'tag-1', name: 'test' }]
      };
      
      const result = mapToSelectableImage(completeImage);
      
      expect(result.id).toBe(completeImage.id);
      expect(result.title).toBe(completeImage.title);
      expect(result.description).toBe(completeImage.description);
      expect(result.url).toBe(completeImage.url);
      expect(result.userId).toBe(completeImage.userId);
      expect(result.tags).toEqual(completeImage.tags);
    });
    
    it('should handle missing optional fields', () => {
      const imageWithMinimalOptionals = {
        id: 'test-image-1',
        title: 'Test Image',
        url: '/test.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        // description and tags are optional
      };
      
      const result = mapToSelectableImage(imageWithMinimalOptionals);
      
      expect(result.id).toBe(imageWithMinimalOptionals.id);
      expect(result.title).toBe(imageWithMinimalOptionals.title);
      expect(result.url).toBe(imageWithMinimalOptionals.url);
      expect(result.userId).toBe(imageWithMinimalOptionals.userId);
      expect(result.description).toBeUndefined();
      expect(result.tags).toEqual([]);
    });
    
    it('should handle complete image objects correctly', () => {
      const completeImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ id: 'tag-1', name: 'test' }]
      };
      
      const result = mapToSelectableImage(completeImage);
      
      expect(result.id).toBe(completeImage.id);
      expect(result.title).toBe(completeImage.title);
      expect(result.description).toBe(completeImage.description);
      expect(result.url).toBe(completeImage.url);
      expect(result.userId).toBe(completeImage.userId);
      expect(result.tags).toEqual(completeImage.tags);
    });
  });
  
  describe('Integration with ImageSchema', () => {
    it('should properly convert between schemas', () => {
      // Create a valid image according to the main schema
      const validImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Parse through the main schema
      const parsedImage = ImageSchema.parse(validImage);
      
      // Then map to a selectable image
      const selectableImage = mapToSelectableImage(parsedImage);
      
      // Should be valid according to the SelectableImageSchema
      const result = SelectableImageSchema.safeParse(selectableImage);
      expect(result.success).toBe(true);
    });
  });
});
