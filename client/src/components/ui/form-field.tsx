/**
 * Reusable Form Field Component
 * Standardizes form field patterns across the application
 */
import { Input, Label, Textarea } from '@/components/ui/form-inputs';
import type { FieldError, UseFormRegister } from 'react-hook-form';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  error?: FieldError;
  register: UseFormRegister<any>; // react-hook-form register function
  rows?: number;
  className?: string;
}

export function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  required = false,
  error,
  register,
  rows = 3,
  className = ""
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const baseInputClasses = `w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-accent-blue transition-colors ${
    error ? 'border-red-500 focus:border-red-500' : 'border-white/30 focus:border-accent-blue'
  }`;

  const ariaProps = {
    'aria-invalid': error ? true : false,
    'aria-describedby': [error && errorId, placeholder && helpId].filter(Boolean).join(' ') || undefined,
    'aria-required': required,
    'data-testid': `input-${id}`
  };

  return (
    <div className={className}>
      <Label 
        htmlFor={id} 
        className="block text-sm font-medium mb-1"
        data-testid={`label-${id}`}
      >
        {label} {required && <span aria-label="required" className="text-red-400">*</span>}
      </Label>
      
      {type === 'textarea' ? (
        <Textarea
          id={id}
          {...register(id)}
          rows={rows}
          className={`${baseInputClasses} resize-none min-h-[88px]`}
          placeholder={placeholder}
          {...ariaProps}
        />
      ) : (
        <Input
          id={id}
          type={type}
          {...register(id)}
          className={baseInputClasses}
          placeholder={placeholder}
          {...ariaProps}
        />
      )}
      
      {error && (
        <p 
          id={errorId} 
          className="text-red-400 text-xs mt-1 flex items-center gap-1" 
          role="alert" 
          aria-atomic="true"
          data-testid={`error-${id}`}
        >
          <span aria-hidden="true">⚠</span>
          {error.message}
        </p>
      )}
      
      {placeholder && !error && (
        <p 
          id={helpId} 
          className="text-white/60 text-xs mt-1" 
          aria-live="polite"
        >
          {type === 'email' && 'We\'ll use this to send booking confirmations'}
          {type === 'tel' && 'We\'ll call if there are any issues with your campaign'}
          {type === 'textarea' && 'Optional: Let us know about any special requirements'}
        </p>
      )}
    </div>
  );
}
