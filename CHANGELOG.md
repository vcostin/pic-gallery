# Changelog

## [Unreleased]

### Fixed
- Gallery image removal now properly persists to database ([#123](https://github.com/your-org/pic-gallery/pull/123))
  - Fixed issue where removed images would reappear after saving the gallery
  - Updated `confirmRemoveImage` in gallery edit page to use `GalleryService.removeImage`
  - Added deprecation notice to DELETE endpoint for gallery images

## [1.2.0] - 2025-04-25

### Added
- Gallery ordering functionality
- Cover image support for galleries
- Dark mode toggle

### Changed
- Migrated form validation to Zod schemas
- Improved error handling in API endpoints

## [1.1.0] - 2025-03-15

### Added
- Tag management for images
- User profile customization
- Image search by tags

### Fixed
- Authentication token refresh mechanism
- Image upload progress indicator

## [1.0.0] - 2025-02-01

### Initial Release
- User authentication
- Image upload and management
- Gallery creation and management
- Basic UI components
