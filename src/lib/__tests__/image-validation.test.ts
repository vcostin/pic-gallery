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
        tags: [{ id: 'tag-1', name: 'test' }]
      };
      
      const result = SelectableImageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
    });
    
    it('should validate image objects without userId', () => {
      const incompleteImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        tags: [{ id: 'tag-1', name: 'test' }]
      };
      
      const result = SelectableImageSchema.safeParse(incompleteImage);
      expect(result.success).toBe(true);
    });
    
    it('should validate image objects without createdAt/updatedAt', () => {
      const incompleteImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        userId: 'user-123'
      };
      
      const result = SelectableImageSchema.safeParse(incompleteImage);
      expect(result.success).toBe(true);
    });
    
    it('should validate image objects without tags', () => {
      const incompleteImage = {
        id: 'test-image-1',
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg',
        userId: 'user-123'
      };
      
      const result = SelectableImageSchema.safeParse(incompleteImage);
      expect(result.success).toBe(true);
    });
    
    it('should reject image objects without required fields', () => {
      // Missing id
      let invalidImage = {
        title: 'Test Image',
        description: 'A test image',
        url: '/test.jpg'
      };
      
      let result = SelectableImageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      
      // Missing title
      invalidImage = {
        description: 'A test image',
        url: '/test.jpg'
      };
      
      result = SelectableImageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      
      // Missing url
      invalidImage = {
        title: 'Test Image',
        description: 'A test image'
      };
      
      result = SelectableImageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
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
      const incompleteImage = {
        id: 'test-image-1',
        title: 'Test Image',
        url: '/test.jpg'
      };
      
      const result = mapToSelectableImage(incompleteImage);
      
      expect(result.id).toBe(incompleteImage.id);
      expect(result.title).toBe(incompleteImage.title);
      expect(result.url).toBe(incompleteImage.url);
      expect(result.description).toBeUndefined();
      expect(result.userId).toBeUndefined();
      expect(result.tags).toEqual([]);
    });
    
    it('should handle partial image objects safely', () => {
      // This image is missing required fields according to the main schema
      const partialImage = {
        id: 'test-image-1'
      };
      
      // Should not throw an error
      const result = mapToSelectableImage(partialImage as Partial<{ id: string; title: string; url: string }>);
      
      expect(result.id).toBe('test-image-1');
      expect(result.title).toBe(''); // Should provide default empty string
      expect(result.url).toBe(''); // Should provide default empty string
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
