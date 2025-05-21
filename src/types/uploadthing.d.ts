/**
 * Type definitions for UploadThing integration
 * 
 * This file extends the Window interface to include the uploadThing property
 * which is used in ProfileForm.tsx for image uploading functionality
 */

interface UploadThingResult {
  url: string;
  [key: string]: any;
}

interface UploadThing {
  startUpload: (files: File[]) => Promise<UploadThingResult[]>;
}

declare global {
  interface Window {
    uploadThing?: UploadThing;
  }
}

export {};
