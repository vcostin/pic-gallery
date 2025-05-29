// Mock implementation for example files
import { LoadingSpinner, ErrorMessage } from '@/components/StatusMessages';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGallerySchema } from '@/lib/schemas';

// Re-export the mocked dependencies for example files
export {
  LoadingSpinner,
  ErrorMessage,
  Button,
  useRouter,
  useForm,
  zodResolver,
  CreateGallerySchema
};
