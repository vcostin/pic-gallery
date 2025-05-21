import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeatureTemplate } from '@/components/examples/FeatureTemplate';

// Mock the Controller component from react-hook-form
jest.mock('react-hook-form', () => {
  const actual = jest.requireActual('react-hook-form');
  return {
    ...actual,
    Controller: ({ render, name, control, ...rest }: any) => {
      const props = {
        field: {
          onChange: jest.fn(),
          onBlur: jest.fn(),
          value: control?._defaultValues?.[name] || '',
          name,
          ref: jest.fn(),
        },
        fieldState: {
          invalid: false,
          isTouched: false,
          isDirty: false,
          error: undefined,
        },
        formState: {
          isSubmitting: false,
          isLoading: false,
        },
      };
      return render(props);
    },
    useFormContext: () => ({
      control: {
        _defaultValues: {
          name: 'test',
          description: 'description',
          category: 'personal',
          isActive: true,
        },
      },
      formState: {
        errors: {},
      },
      register: jest.fn().mockImplementation((name) => ({
        ref: jest.fn(),
        onChange: jest.fn(),
        onBlur: jest.fn(),
        name,
      })),
    }),
  };
});

describe('FeatureTemplate', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <FeatureTemplate
        register={jest.fn()}
        control={{}}
        errors={{}}
        onChange={jest.fn()}
      />
    );
    
    expect(container).toBeInTheDocument();
  });
});
