import { useForm, UseFormRegister, UseFormHandleSubmit, UseFormReset, UseFormSetValue, UseFormWatch, Control, FieldErrors, UseFormProps } from 'react-hook-form';
import { CreateGallerySchema } from '@/lib/schemas';
import { z } from 'zod';

export type GalleryFormData = z.infer<typeof CreateGallerySchema>;

interface UseGalleryFormResult {
  register: UseFormRegister<GalleryFormData>;
  handleSubmit: UseFormHandleSubmit<GalleryFormData>;
  reset: UseFormReset<GalleryFormData>;
  setValue: UseFormSetValue<GalleryFormData>;
  watch: UseFormWatch<GalleryFormData>;
  control: Control<GalleryFormData>;
  formState: {
    errors: FieldErrors<GalleryFormData>;
    isSubmitting: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
}

export function useGalleryForm(options?: UseFormProps<GalleryFormData>): UseGalleryFormResult {
  return useForm<GalleryFormData>({
    mode: 'onBlur',
    ...options
  });
}
