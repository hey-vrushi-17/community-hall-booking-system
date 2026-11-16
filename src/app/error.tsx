'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Civic application error boundary caught:', error);
  }, [error]);

  return (
    <div className="civic-container py-24 sm:py-32 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#FEF3F2] text-[#B42318] flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-[#B42318] mb-2">
        System Notice • Processing Exception
      </span>

      <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight mb-4">
        Unable to Complete Request
      </h1>

      <p className="max-w-md text-sm text-[#615B52] mb-8 leading-relaxed">
        An unexpected error occurred while processing facility data. Our administrative support
        team has logged this event. You can attempt to retry the operation or return to the main
        portal.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="primary" onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry Operation
        </Button>
        <Link href="/">
          <Button variant="secondary" className="gap-2">
            <Home className="h-4 w-4" />
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
