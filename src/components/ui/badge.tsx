import * as React from 'react';
import { twMerge } from 'tailwind-merge';
import { BookingStatus, MaintenanceStatus } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral';
  status?: BookingStatus | MaintenanceStatus;
}

export function Badge({
  className,
  variant = 'default',
  status,
  children,
  ...props
}: BadgeProps) {
  // If a domain status is passed, configure styling automatically
  if (status) {
    let statusClass = 'bg-[#F3EFE8] text-[#615B52] border-[#E5DFD5]';
    let label = status as string;

    switch (status) {
      case 'APPROVED':
        statusClass = 'bg-[#EBF3EE] text-[#1A3B2B] border-[#C3D9CB]';
        label = 'Approved Booking';
        break;
      case 'PENDING':
        statusClass = 'bg-[#FEF6EE] text-[#B54708] border-[#F9DBAF]';
        label = 'Pending Review';
        break;
      case 'REJECTED':
        statusClass = 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]';
        label = 'Declined';
        break;
      case 'CANCELLED':
        statusClass = 'bg-[#F5F2EB] text-[#716B61] border-[#E5DFD5]';
        label = 'Cancelled';
        break;
      case 'SCHEDULED':
      case 'IN_PROGRESS':
        statusClass = 'bg-[#FAEEE8] text-[#C85A32] border-[#F1CEBF]';
        label = status === 'IN_PROGRESS' ? 'Maintenance Underway' : 'Maintenance Scheduled';
        break;
      case 'COMPLETED':
        statusClass = 'bg-[#F5F2EB] text-[#716B61] border-[#E5DFD5]';
        label = 'Maintenance Completed';
        break;
    }

    return (
      <span
        className={twMerge(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
          statusClass,
          className
        )}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {children || label}
      </span>
    );
  }

  const variants = {
    default: 'bg-[#F3EFE8] text-[#1C1917] border-[#E5DFD5]',
    success: 'bg-[#EBF3EE] text-[#1A3B2B] border-[#C3D9CB]',
    warning: 'bg-[#FEF6EE] text-[#B54708] border-[#F9DBAF]',
    danger: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
    neutral: 'bg-white text-[#615B52] border-[#E5DFD5]',
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
