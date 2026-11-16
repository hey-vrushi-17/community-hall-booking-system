import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[#1C1917] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[#C85A32] ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 text-sm rounded-md bg-white border border-[#E5DFD5] text-[#1C1917] placeholder:text-[#8A8275] transition-colors focus:border-[#1A3B2B] focus:ring-1 focus:ring-[#1A3B2B] disabled:bg-[#F3EFE8] disabled:cursor-not-allowed resize-y min-h-[90px]',
              error && 'border-[#D92D20] focus:border-[#D92D20] focus:ring-[#D92D20]',
              className
            )
          )}
          aria-invalid={!!error}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-1 text-xs text-[#615B52]">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-[#D92D20] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
