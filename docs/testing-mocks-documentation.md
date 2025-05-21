# Testing Mocks Documentation

This document describes the mock components used for testing React components in the application, with a focus on the CreateGallery component family.

## CreateGallery Component Mocks

### Basic Mock: `MockCreateGalleryWithZod`

Used in basic tests (`CreateGalleryWithZod.test.tsx`), this mock provides a simple static representation of the component UI structure without actual functionality.

**Features:**
- Renders basic structure of the form
- Includes all essential UI elements with test-ids
- Does not include actual form validation or submission logic

**Usage:**
```jsx
import { MockCreateGalleryWithZod } from './path/to/mock';

// In test
render(<MockCreateGalleryWithZod />);
```

### Enhanced Mock: `MockCreateGalleryWithZodEnhanced`

Used in more comprehensive tests (`CreateGalleryWithZod.enhanced.test.tsx`), this mock provides a more realistic component with working state management and form handling.

**Features:**
- Full state management for form fields
- Simulates form submission and validation
- Handles image selection, addition, and removal
- Shows success and error messages
- Simulates navigation after successful form submission

**Usage:**
```jsx
import { MockCreateGalleryWithZodEnhanced } from './CreateGalleryEnhancedMock';

// In test
render(<MockCreateGalleryWithZodEnhanced />);
```

## Component Testing Strategy

When testing components, we follow these guidelines:

1. **Use Basic Mocks for Unit Tests**
   - Focus on component structure and simple interactions
   - Avoid testing complex state management or API calls

2. **Use Enhanced Mocks for Integration Tests**
   - Test more complex workflows
   - Verify form validation and submission
   - Test integration with other components

3. **Proper Test Isolation**
   - Mock all external dependencies like services and hooks
   - Use act() to properly handle state updates in React tests
   - Add small timeouts after state-changing operations (wrapped in act)

4. **Test-Friendly Component Design**
   - Components should expose test-ids for key elements
   - Business logic should be testable independent of UI

5. **Avoiding Circular Dependencies**
   - Component imports should be direct, not through index files when needed
   - Aliased imports should be clearly documented
