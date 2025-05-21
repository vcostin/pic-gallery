// Mock version of the CreateGallery component for tests

import React from 'react';

export function MockCreateGallery(): React.ReactElement {
  return (
    <div data-testid="mock-create-gallery">
      <h2>Create New Gallery</h2>
      <button data-testid="add-images-button">Add Images</button>
      <form data-testid="gallery-form">
        <input data-testid="title-input" type="text" name="title" />
        <textarea data-testid="description-input" name="description" />
        <label>
          <input data-testid="is-published-input" type="checkbox" name="isPublished" />
          Publish Gallery
        </label>
        <button data-testid="submit-button" type="submit">Create Gallery</button>
        <button data-testid="cancel-button" type="button">Cancel</button>
      </form>
    </div>
  );
}
