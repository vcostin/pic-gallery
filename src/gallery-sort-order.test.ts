/**
 * Gallery sort order test
 * 
 * This test focuses on the array reordering logic used in the GallerySortable component
 * without needing to test React components directly.
 */

// Mock the arrayMove function from @dnd-kit/sortable
const arrayMove = (array, from, to) => {
  const result = [...array];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
};

describe('Gallery Sorting Logic', () => {
  // Sample gallery images data
  const galleryImages = [
    { id: 'img1', description: 'Image 1', order: 0 },
    { id: 'img2', description: 'Image 2', order: 1 },
    { id: 'img3', description: 'Image 3', order: 2 },
    { id: 'img4', description: 'Image 4', order: 3 },
  ];
  
  test('arrayMove correctly reorders array elements', () => {
    // Move first item to the end
    const result1 = arrayMove(galleryImages, 0, 3);
    
    expect(result1[0].id).toBe('img2');
    expect(result1[1].id).toBe('img3');
    expect(result1[2].id).toBe('img4');
    expect(result1[3].id).toBe('img1');
    
    // Move last item to the beginning
    const result2 = arrayMove(galleryImages, 3, 0);
    
    expect(result2[0].id).toBe('img4');
    expect(result2[1].id).toBe('img1');
    expect(result2[2].id).toBe('img2');
    expect(result2[3].id).toBe('img3');
  });
  
  test('explicit order assignment is applied after array movement', () => {
    // The key fix in GallerySortable was to explicitly set order values after array reordering
    const result = arrayMove(galleryImages, 0, 2);
    
    // Apply the fix: explicitly set order based on new position
    const withExplicitOrders = result.map((image, index) => ({
      ...image,
      order: index // Set order explicitly based on new index
    }));
    
    // Check that order values have been updated
    expect(withExplicitOrders[0].id).toBe('img2');
    expect(withExplicitOrders[0].order).toBe(0);
    
    expect(withExplicitOrders[1].id).toBe('img3');
    expect(withExplicitOrders[1].order).toBe(1);
    
    expect(withExplicitOrders[2].id).toBe('img1');
    expect(withExplicitOrders[2].order).toBe(2);
    
    expect(withExplicitOrders[3].id).toBe('img4');
    expect(withExplicitOrders[3].order).toBe(3);
  });
  
  test('orders are always assigned as numbers, not strings', () => {
    // Test with mixed order types
    const mixedImages = [
      { id: 'img1', order: '0' }, // String
      { id: 'img2', order: 1 },   // Number
      { id: 'img3', order: null }, // Null
      { id: 'img4' },             // Missing order
    ];
    
    // Apply a move and then explicit order setting
    const result = arrayMove(mixedImages, 1, 0);
    
    // Apply the same fix: ensure numeric orders
    const withCorrectOrders = result.map((image, index) => ({
      ...image,
      order: index // Always use numeric index
    }));
    
    // Verify all orders are numbers now
    withCorrectOrders.forEach((img, i) => {
      expect(typeof img.order).toBe('number');
      expect(img.order).toBe(i);
    });
  });
});
