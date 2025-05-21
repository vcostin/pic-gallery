import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormRegister, Control, FieldErrors, UseFormHandleSubmit } from 'react-hook-form';

// Import from the feature directory, not the individual files
import { 
  FeatureTemplateWithZod, 
  FeatureTemplateSchema, 
  type FeatureTemplateData 
} from '../FeatureTemplate';

// Test wrapper component to provide the form context
function TestWrapper({ children, defaultValues = {} }: { 
  children: (methods: {
    register: UseFormRegister<FeatureTemplateData>;
    control: Control<FeatureTemplateData>;
    formState: { errors: FieldErrors<FeatureTemplateData> };
    handleSubmit: UseFormHandleSubmit<FeatureTemplateData>;
  }) => React.ReactNode;
  defaultValues?: Partial<FeatureTemplateData>;
}) {
  const methods = useForm<FeatureTemplateData>({
    resolver: zodResolver(FeatureTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'personal',
      isActive: true,
      ...defaultValues,
    },
  });
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => {})}>
        {children({
          register: methods.register,
          control: methods.control,
          formState: methods.formState,
          handleSubmit: methods.handleSubmit
        })}
      </form>
    </FormProvider>
  );
}

describe('FeatureTemplateWithZod', () => {
  it('renders all form fields correctly', () => {
    const mockOnChange = jest.fn();
    
    render(
      <TestWrapper>
        {({ register, control, formState }) => (
          <FeatureTemplateWithZod
            register={register}
            control={control}
            errors={formState.errors}
            onChange={mockOnChange}
          />
        )}
      </TestWrapper>
    );
    
    // Check if all form elements are rendered
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
    expect(screen.getByTestId('active-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });
  
  it('displays validation errors for required fields', () => {
    render(
      <TestWrapper>
        {({ register, control }) => (
          <FeatureTemplateWithZod
            register={register}
            control={control}
            errors={{
              name: { type: 'required', message: 'Name is required' },
              description: { type: 'required', message: 'Description is required' }
            }}
            onChange={() => {}}
          />
        )}
      </TestWrapper>
    );
    
    // Check if error messages are displayed
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });
  
  it('handles form input changes', () => {
    const mockOnChange = jest.fn();
    
    render(
      <TestWrapper>
        {({ register, control, formState }) => (
          <FeatureTemplateWithZod
            register={register}
            control={control}
            errors={formState.errors}
            onChange={mockOnChange}
          />
        )}
      </TestWrapper>
    );
    
    // Change input values and check if onChange is called
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'New Feature' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('name', 'New Feature');
    
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('description', 'Test description');
    
    const categorySelect = screen.getByTestId('category-select');
    fireEvent.change(categorySelect, { target: { value: 'business' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('category', 'business');
    
    const activeCheckbox = screen.getByTestId('active-checkbox');
    fireEvent.click(activeCheckbox);
    
    expect(mockOnChange).toHaveBeenCalledWith('isActive', false);
  });
  
  it('renders with initial data correctly', () => {
    const initialData: FeatureTemplateData = {
      name: 'Existing Feature',
      description: 'Existing description',
      category: 'business',
      isActive: false,
    };
    
    render(
      <TestWrapper defaultValues={initialData}>
        {({ register, control, formState }) => (
          <FeatureTemplateWithZod
            register={register}
            control={control}
            errors={formState.errors}
            onChange={() => {}}
          />
        )}
      </TestWrapper>
    );
    
    // Check if form fields have the initial values
    expect(screen.getByTestId('name-input')).toHaveValue('Existing Feature');
    expect(screen.getByTestId('description-input')).toHaveValue('Existing description');
    expect(screen.getByTestId('category-select')).toHaveValue('business');
    expect(screen.getByTestId('active-checkbox')).not.toBeChecked();
  });
});
