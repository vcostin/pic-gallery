'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  message: ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'red' | 'blue';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonColor = 'blue'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  // Map the color to our Button variant
  const confirmButtonVariant = confirmButtonColor === 'red' ? 'danger' : 'primary';

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        
        <CardContent>
          <div className="text-gray-600 dark:text-gray-300">
            {message}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleCancel}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmButtonText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
