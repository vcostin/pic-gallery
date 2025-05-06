import { writeFile } from 'fs/promises';
import { join } from 'path';
import logger from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return apiError('No file uploaded', 400);
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    return apiSuccess({ url: `/uploads/${filename}` });
  } catch (error) {
    logger.error('Upload error:', error);
    return apiError('Upload failed');
  }
}
