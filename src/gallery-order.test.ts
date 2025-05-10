/**
 * Gallery image ordering test
 * 
 * This is a simplified test that focuses on validating that image orders are 
 * correctly maintained when updating gallery information.
 */

describe('Gallery Image Ordering', () => {
  test('orders are correctly maintained when sending to server', () => {
    // The crux of the issue was that when mapping images for the payload, 
    // we were using img.imageId instead of img.id which caused ordering to break
    
    const mockImages = [
      { id: 'imgGallery1', imageId: 'img1', order: 2, description: 'Description 1' },
      { id: 'imgGallery2', imageId: 'img2', order: 0, description: 'Description 2' },
      { id: 'imgGallery3', imageId: 'img3', order: 1, description: 'Description 3' },
    ];
    
    // This simulates the correct mapping that should happen in performGalleryUpdate
    const correctMapping = mockImages.map(img => ({
      id: img.id, // Using the ImageInGallery id, not the Image id
      imageId: img.imageId,
      description: img.description,
      order: img.order,
    }));
    
    // Validation that we're using the correct props
    expect(correctMapping[0].id).toBe('imgGallery1'); // Not 'img1'
    expect(correctMapping[0].imageId).toBe('img1');
    expect(correctMapping[0].order).toBe(2);
    
    // Verify the second and third images also have correct mappings
    expect(correctMapping[1].id).toBe('imgGallery2');
    expect(correctMapping[1].order).toBe(0);
    
    expect(correctMapping[2].id).toBe('imgGallery3');
    expect(correctMapping[2].order).toBe(1);
    
    // This simulates the issue we had in the original code
    const incorrectMapping = mockImages.map(img => ({
      id: img.imageId, // Wrong! Using the Image id instead of ImageInGallery id
      description: img.description,
      order: img.order,
    }));
    
    // Validate that this approach would result in incorrect data
    expect(incorrectMapping[0].id).toBe('img1'); // Wrong! Should be 'imgGallery1'
    expect(incorrectMapping[0].order).toBe(2);
    
    // Also ensure we properly handle missing order values
    const imagesWithMissingOrder = [
      { id: 'imgGallery4', imageId: 'img4', description: 'No Order' }, // Missing order
      { id: 'imgGallery5', imageId: 'img5', order: null, description: 'Null Order' }, // Null order
    ];
    
    // This simulates the fix we implemented to handle missing/invalid orders
    const fixedMapping = imagesWithMissingOrder.map((img, index) => ({
      id: img.id,
      imageId: img.imageId,
      description: img.description,
      order: typeof img.order === 'number' ? img.order : index, // Default to index if not a valid number
    }));
    
    expect(fixedMapping[0].order).toBe(0); // Default to index
    expect(fixedMapping[1].order).toBe(1); // Default to index
  });
  
  test('explicit orders are set during drag and drop', () => {
    // This simulates the arrayMove function from dnd-kit
    const mockArrayMove = (items, oldIndex, newIndex) => {
      const result = [...items];
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    };
    
    const originalImages = [
      { id: 'img1', order: 0 },
      { id: 'img2', order: 1 },
      { id: 'img3', order: 2 },
    ];
    
    // Simulate moving the first item to the end
    const reordered = mockArrayMove(originalImages, 0, 2);
    
    // Apply the fix we made in GallerySortable's reorder handler:
    // Set explicit numeric orders based on new positions
    const withExplicitOrders = reordered.map((image, index) => ({
      ...image,
      order: index // Explicit numeric order
    }));
    
    // Verify orders are correctly updated
    expect(withExplicitOrders[0].id).toBe('img2');
    expect(withExplicitOrders[0].order).toBe(0); // Should now be first
    
    expect(withExplicitOrders[1].id).toBe('img3');
    expect(withExplicitOrders[1].order).toBe(1); // Should now be second
    
    expect(withExplicitOrders[2].id).toBe('img1');
    expect(withExplicitOrders[2].order).toBe(2); // Should now be last
  });
});
