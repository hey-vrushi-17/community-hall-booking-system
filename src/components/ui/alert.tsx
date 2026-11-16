import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const styles = {
    info: {
      container: 'bg-[#F0F5F2] border-[#C3D9CB] text-[#1A3B2B]',
      icon: <Info className="h-5 w-5 text-[#1A3B2B] shrink-0" aria-hidden="true" />,
    },
    success: {
      container: 'bg-[#EBF3EE] border-[#A8CCA7] text-[#132B20]',
      icon: (
        <CheckCircle2 className="h-5 w-5 text-[#1A3B2B] shrink-0" aria-hidden="true" />
      ),
    },
    warning: {
      container: 'bg-[#FEF6EE] border-[#F9DBAF] text-[#8C3B00]',
      icon: (
        <AlertTriangle className="h-5 w-5 text-[#B54708] shrink-0" aria-hidden="true" />
      ),
    },
    error: {
      container: 'bg-[#FEF3F2] border-[#FECDCA] text-[#912018]',
      icon: <XCircle className="h-5 w-5 text-[#B42318] shrink-0" aria-hidden="true" />,
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={twMerge(
        clsx(
          'p-4 rounded-md border flex items-start gap-3 text-sm leading-relaxed',
          current.container,
          className
        )
      )}
      {...props}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1">{title}</h5>}
        <div className="text-sm opacity-95">{children}</div>
      </div>
    </div>
  );
}
