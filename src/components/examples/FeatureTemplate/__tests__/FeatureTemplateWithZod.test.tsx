import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeatureTemplateWithZod } from '../FeatureTemplateWithZod';

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

describe('FeatureTemplateWithZod', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <FeatureTemplateWithZod
        register={jest.fn()}
        control={{} as any}
        errors={{}}
        onChange={jest.fn()}
      />
    );
    
    expect(container).toBeInTheDocument();
  });
});
