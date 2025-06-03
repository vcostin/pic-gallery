export interface FileValidationResult {
  isValid: boolean;
  error?: string | null;
  warnings?: string[];
}

export interface FileValidationOptions {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export class FileValidator {
  private static readonly DEFAULT_MAX_SIZE = 4 * 1024 * 1024; // 4MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  static validateFiles(
    files: FileList | File[], 
    options: FileValidationOptions = {}
  ): FileValidationResult {
    const {
      maxFileSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.DEFAULT_ALLOWED_TYPES,
      maxFiles = 1
    } = options;

    const fileArray = Array.from(files);

    // Check file count
    if (fileArray.length > maxFiles) {
      return {
        isValid: false,
        error: `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed. You selected ${fileArray.length}.`
      };
    }

    if (fileArray.length === 0) {
      return {
        isValid: false,
        error: 'No files selected.'
      };
    }

    const warnings: string[] = [];

    // Check each file
    for (const file of fileArray) {
      // Check file type
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        return {
          isValid: false,
          error: `File type "${file.type}" is not supported. Allowed types: ${allowedTypes.join(', ')}`
        };
      }

      // Check file size
      if (file.size > maxFileSize) {
        const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return {
          isValid: false,
          error: `File "${file.name}" is too large (${fileSizeMB}MB). Maximum size allowed is ${maxSizeMB}MB.`
        };
      }

      // Check if file is very small (might be corrupted)
      if (file.size < 1024) { // Less than 1KB
        warnings.push(`File "${file.name}" is very small (${file.size} bytes). Please verify it's not corrupted.`);
      }

      // Check if file is very large (might take long to upload)
      const largeSizeThreshold = maxFileSize * 0.8; // 80% of max size
      if (file.size > largeSizeThreshold) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        warnings.push(`File "${file.name}" is quite large (${fileSizeMB}MB). Upload may take longer.`);
      }
    }

    return {
      isValid: true,
      error: null,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    const size = bytes / Math.pow(k, i);
    const formatted = i === 0 ? size.toString() : size.toFixed(1);
    
    return `${formatted} ${sizes[i]}`;
  }

  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }

  static generateSafeFilename(originalName: string): string {
    // Remove or replace unsafe characters
    const safeName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    // Ensure we have a valid filename
    if (!safeName || safeName === '.') {
      return `image_${Date.now()}`;
    }

    return safeName;
  }

  static extractFilenameTitle(filename: string): string {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Handle edge cases early
    if (!nameWithoutExt || nameWithoutExt.trim() === '' || /^\.+$/.test(nameWithoutExt)) {
      return 'Untitled';
    }
    
    // Replace separators with spaces first
    let cleanName = nameWithoutExt.replace(/[_-]+/g, ' ');
    
    // Remove common camera/phone prefixes but keep meaningful parts
    // For IMG_1234 -> keep "1234", for IMG_description -> keep "description"
    cleanName = cleanName.replace(/^(IMG|DSC|PICT)\s+/gi, '');
    cleanName = cleanName.replace(/^Screenshot\s*/gi, '');
    
    // Remove timestamp patterns that are clearly timestamps at the start
    cleanName = cleanName.replace(/^\d{8}\s+\d{6}\s*/g, ''); // YYYYMMDD HHMMSS
    
    // Clean up extra spaces
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    // If nothing meaningful left, return a default
    if (!cleanName || cleanName.length < 2) {
      return 'Untitled';
    }

    // Capitalize first letter of each word
    return cleanName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
