import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#1C1917] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[#C85A32] ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 text-sm rounded-md bg-white border border-[#E5DFD5] text-[#1C1917] placeholder:text-[#8A8275] transition-colors focus:border-[#1A3B2B] focus:ring-1 focus:ring-[#1A3B2B] disabled:bg-[#F3EFE8] disabled:cursor-not-allowed',
              error && 'border-[#D92D20] focus:border-[#D92D20] focus:ring-[#D92D20]',
              className
            )
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          {...props}
        />
        {helperText && !error && (
          <p id={`${inputId}-desc`} className="mt-1 text-xs text-[#615B52]">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-[#D92D20] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
