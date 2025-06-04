import { FileValidator } from '../fileValidation';

// Mock File for testing
class MockFile extends File {
  constructor(parts: any[], filename: string, properties?: any) {
    super(parts, filename, properties);
  }
}

describe('FileValidator', () => {
  describe('validateFiles', () => {
    it('should validate valid image files', () => {
      const mockFiles = [
        new MockFile([''], 'test.jpg', { type: 'image/jpeg' }),
        new MockFile([''], 'test.png', { type: 'image/png' })
      ];
      
      const fileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        }
      } as FileList;

      const result = FileValidator.validateFiles(fileList, {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        allowedTypes: ['image/jpeg', 'image/png']
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject files that exceed max file size', () => {
      // Create a mock file that's larger than allowed
      const largeMockFile = new MockFile([''], 'large.jpg', { 
        type: 'image/jpeg'
      });
      
      // Override the size property
      Object.defineProperty(largeMockFile, 'size', {
        value: 10 * 1024 * 1024, // 10MB
        writable: false
      });

      const fileList = {
        length: 1,
        item: () => largeMockFile,
        [Symbol.iterator]: function* () {
          yield largeMockFile;
        }
      } as FileList;

      const result = FileValidator.validateFiles(fileList, {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        allowedTypes: ['image/jpeg']
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should reject unsupported file types', () => {
      const mockFile = new MockFile([''], 'document.pdf', { 
        type: 'application/pdf' 
      });

      const fileList = {
        length: 1,
        item: () => mockFile,
        [Symbol.iterator]: function* () {
          yield mockFile;
        }
      } as FileList;

      const result = FileValidator.validateFiles(fileList, {
        maxFileSize: 5 * 1024 * 1024,
        maxFiles: 5,
        allowedTypes: ['image/jpeg', 'image/png']
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not supported');
    });
  });

  describe('extractFilenameTitle', () => {
    it('should extract clean title from filename', () => {
      expect(FileValidator.extractFilenameTitle('my-photo.jpg')).toBe('My Photo');
      expect(FileValidator.extractFilenameTitle('vacation_2024.png')).toBe('Vacation 2024');
      expect(FileValidator.extractFilenameTitle('IMG_1234.jpeg')).toBe('1234');
    });

    it('should handle special characters and numbers', () => {
      expect(FileValidator.extractFilenameTitle('photo-2024-01-15.jpg')).toBe('Photo 2024 01 15');
      expect(FileValidator.extractFilenameTitle('sunset_at_beach.png')).toBe('Sunset At Beach');
    });

    it('should handle empty or invalid filenames', () => {
      expect(FileValidator.extractFilenameTitle('')).toBe('Untitled');
      expect(FileValidator.extractFilenameTitle('.jpg')).toBe('Untitled');
      expect(FileValidator.extractFilenameTitle('...')).toBe('Untitled');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(FileValidator.formatFileSize(1024)).toBe('1.0 KB');
      expect(FileValidator.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(FileValidator.formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(FileValidator.formatFileSize(500)).toBe('500 B');
    });

    it('should handle zero and negative sizes', () => {
      expect(FileValidator.formatFileSize(0)).toBe('0 B');
      expect(FileValidator.formatFileSize(-100)).toBe('0 B');
    });
  });
});
