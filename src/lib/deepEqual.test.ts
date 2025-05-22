import { deepEqual } from '@/lib/deepEqual';

describe('deepEqual', () => {
  describe('primitives', () => {
    it('should return true for identical primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('string', 'string')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('string', 'different')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(1, '1')).toBe(false);
    });
  });

  describe('arrays', () => {
    it('should return true for empty arrays', () => {
      expect(deepEqual([], [])).toBe(true);
    });

    it('should return true for identical arrays with primitives', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
    });

    it('should return false for arrays of different lengths', () => {
      expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
      expect(deepEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
    });

    it('should return false for arrays with different elements', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual(['a', 'b', 'c'], ['a', 'x', 'c'])).toBe(false);
    });

    it('should handle nested arrays', () => {
      expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false);
    });
  });

  describe('objects', () => {
    it('should return true for empty objects', () => {
      expect(deepEqual({}, {})).toBe(true);
    });

    it('should return true for identical simple objects', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('should return true for identical objects regardless of property order', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('should return false for objects with different values', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    });

    it('should return false for objects with different properties', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
    });

    it('should return false for objects with different number of properties', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should handle nested objects', () => {
      expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
      expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } })).toBe(false);
    });

    it('should handle nullish values in objects', () => {
      expect(deepEqual({ a: null, b: undefined }, { a: null, b: undefined })).toBe(true);
      expect(deepEqual({ a: null }, { a: undefined })).toBe(false);
    });
  });

  describe('complex nested structures', () => {
    it('should handle complex objects with arrays', () => {
      const obj1 = { 
        a: 1, 
        b: [1, 2, { c: 'value' }], 
        d: { e: 10, f: [true, false] } 
      };
      
      const obj2 = { 
        a: 1, 
        b: [1, 2, { c: 'value' }], 
        d: { e: 10, f: [true, false] } 
      };
      
      expect(deepEqual(obj1, obj2)).toBe(true);
    });
    
    it('should return false for different complex structures', () => {
      const obj1 = { 
        a: 1, 
        b: [1, 2, { c: 'value' }], 
        d: { e: 10, f: [true, false] } 
      };
      
      const obj2 = { 
        a: 1, 
        b: [1, 2, { c: 'different' }], 
        d: { e: 10, f: [true, false] } 
      };
      
      expect(deepEqual(obj1, obj2)).toBe(false);
    });

    it('should handle arrays of objects', () => {
      const arr1 = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      
      const arr2 = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      
      expect(deepEqual(arr1, arr2)).toBe(true);
      
      const arr3 = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bobby' }
      ];
      
      expect(deepEqual(arr1, arr3)).toBe(false);
    });
  });

  describe('real world examples', () => {
    it('should handle gallery images comparison from the application', () => {
      const originalImages = [
        {
          id: 'img1',
          description: 'A beautiful landscape',
          order: 0,
          image: {
            id: 'image1',
            url: 'https://example.com/image1.jpg',
            title: 'Landscape',
            tags: [{ id: 'tag1', name: 'nature' }]
          }
        },
        {
          id: 'img2',
          description: 'A portrait',
          order: 1,
          image: {
            id: 'image2',
            url: 'https://example.com/image2.jpg',
            title: 'Portrait',
            tags: [{ id: 'tag2', name: 'people' }]
          }
        }
      ];
      
      // Identical to originalImages
      const sameImages = [
        {
          id: 'img1',
          description: 'A beautiful landscape',
          order: 0,
          image: {
            id: 'image1',
            url: 'https://example.com/image1.jpg',
            title: 'Landscape',
            tags: [{ id: 'tag1', name: 'nature' }]
          }
        },
        {
          id: 'img2',
          description: 'A portrait',
          order: 1,
          image: {
            id: 'image2',
            url: 'https://example.com/image2.jpg',
            title: 'Portrait',
            tags: [{ id: 'tag2', name: 'people' }]
          }
        }
      ];
      
      // Different order (should be detected as not equal)
      const reorderedImages = [
        {
          id: 'img2',
          description: 'A portrait',
          order: 0, // Changed order
          image: {
            id: 'image2',
            url: 'https://example.com/image2.jpg',
            title: 'Portrait',
            tags: [{ id: 'tag2', name: 'people' }]
          }
        },
        {
          id: 'img1',
          description: 'A beautiful landscape',
          order: 1, // Changed order
          image: {
            id: 'image1',
            url: 'https://example.com/image1.jpg',
            title: 'Landscape',
            tags: [{ id: 'tag1', name: 'nature' }]
          }
        }
      ];
      
      // Changed description (should be detected as not equal)
      const changedDescriptionImages = [
        {
          id: 'img1',
          description: 'A beautiful mountain landscape', // Changed description
          order: 0,
          image: {
            id: 'image1',
            url: 'https://example.com/image1.jpg',
            title: 'Landscape',
            tags: [{ id: 'tag1', name: 'nature' }]
          }
        },
        {
          id: 'img2',
          description: 'A portrait',
          order: 1,
          image: {
            id: 'image2',
            url: 'https://example.com/image2.jpg',
            title: 'Portrait',
            tags: [{ id: 'tag2', name: 'people' }]
          }
        }
      ];
      
      expect(deepEqual(originalImages, sameImages)).toBe(true);
      expect(deepEqual(originalImages, reorderedImages)).toBe(false);
      expect(deepEqual(originalImages, changedDescriptionImages)).toBe(false);
    });
  });
});
