# Test Data for E2E Testing

This directory contains test assets that are used by E2E tests to ensure reliable testing across different environments (local development, CI, etc.).

## Directory Structure

```
test-data/
├── images/
│   ├── test-image-1.jpg    # Sample test image for upload tests
│   ├── test-image-2.jpg    # Second sample test image
│   └── README.md           # This file
```

## Purpose

The test assets in this directory solve a critical issue where E2E tests were failing in CI environments due to:

- **Hardcoded file paths** referencing files that only exist in local development
- **Dynamic filenames** with timestamps that aren't reproducible
- **Missing test assets** in clean CI environments

## Usage in Tests

E2E tests should reference these files using relative paths from the project root:

```typescript
// ✅ Good - Use reliable test assets
await page.setInputFiles('input[type="file"]', './test-data/images/test-image-1.jpg');

// ❌ Bad - Don't use hardcoded uploads
await page.setInputFiles('input[type="file"]', './public/uploads/1746721666749-415981397-----8856477.jpeg');
```

## File Details

- **test-image-1.jpg**: 44KB JPEG image for basic upload testing
- **test-image-2.jpg**: 44KB JPEG image for multi-image testing

## Version Control

These files are committed to version control to ensure they're available in all environments including CI pipelines.

## Adding New Test Assets

When adding new test assets:

1. Use descriptive, predictable filenames
2. Keep file sizes reasonable (< 100KB for fast tests)
3. Document the purpose in this README
4. Ensure files are committed to git
