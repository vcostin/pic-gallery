/**
 * Schemas for image usage related API responses
 */
import { z } from "zod";
import { createApiSuccessSchema } from "../schemas";

// Schema for gallery information in usage response
export const GalleryReferenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  isCover: z.boolean().default(false)
});

// Schema for image usage response
export const ImageUsageSchema = z.object({
  galleries: z.array(GalleryReferenceSchema).default([])
});

// Schema for API response with image usage data
export const ImageUsageResponseSchema = createApiSuccessSchema(ImageUsageSchema);

export type GalleryReference = z.infer<typeof GalleryReferenceSchema>;
export type ImageUsage = z.infer<typeof ImageUsageSchema>;
