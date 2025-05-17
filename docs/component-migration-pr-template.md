# Component Migration PR Template

## Description

This PR migrates the `[COMPONENT_NAME]` component from its original implementation to use the Zod schema-based version previously built as `[COMPONENT_NAME]WithZod`. This is part of our ongoing effort to standardize form validation and type safety across the application using Zod schemas.

## Changes Made

- [ ] Migrated consumers of `[COMPONENT_NAME]` to use the Zod-based implementation
- [ ] Updated imports across all affected files
- [ ] Renamed `[COMPONENT_NAME]WithZod` to `[COMPONENT_NAME]`
- [ ] Removed the original non-Zod implementation
- [ ] Added/Updated tests to ensure correct functionality

## Migration Details

**Original Component:**
- Used manual form state management with useState hooks
- Had minimal or ad-hoc validation
- Used manually defined TypeScript interfaces

**New Component:**
- Uses react-hook-form with zodResolver
- Leverages schema-derived types from our centralized Zod schemas
- Provides consistent validation and error handling

## Affected Files

- List of files modified with brief descriptions of changes

## Testing Performed

- Unit tests added/modified
- Manual testing of affected functionality
- Any specific test cases that were particularly important

## Screenshots

[If UI changes were made, include before/after screenshots]

## Checklist

- [ ] All tests are passing
- [ ] No console errors in both development and production builds
- [ ] Documentation has been updated (if necessary)
- [ ] The component behaves identically in key user flows
- [ ] Form validation behaves as expected

## Notes

[Any additional notes, challenges faced, or decisions made during the migration]
