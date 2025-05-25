/**
 * Custom hook for managing gallery edit form with react-hook-form and Zod validation
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGallerySchema } from '@/lib/schemas';
import { z } from 'zod';

export type GalleryFormData = z.infer<typeof CreateGallerySchema>;

export function useGalleryEditForm() {
  const formMethods = useForm<GalleryFormData>({
    resolver: zodResolver(CreateGallerySchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      isPublic: false,
      themeColor: '',
      backgroundColor: '',
      backgroundImageUrl: '',
      accentColor: '',
      fontFamily: '',
      displayMode: '',
      layoutType: ''
    }
  });

  return {
    register: formMethods.register,
    handleSubmit: formMethods.handleSubmit,
    reset: formMethods.reset,
    watch: formMethods.watch,
    errors: formMethods.formState.errors,
    isDirty: formMethods.formState.isDirty,
    isSubmitting: formMethods.formState.isSubmitting,
    // For compatibility with existing component interface
    form: {
      register: formMethods.register,
      handleSubmit: formMethods.handleSubmit,
      formState: { errors: formMethods.formState.errors }
    }
  };
}
