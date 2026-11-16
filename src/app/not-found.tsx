import Link from 'next/link';
import { Landmark, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="civic-container py-24 sm:py-32 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#FAEEE8] text-[#C85A32] flex items-center justify-center mb-6">
        <Landmark className="h-8 w-8" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] mb-2">
        Error 404 • Record Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight mb-4">
        Facility or Page Not Located
      </h1>

      <p className="max-w-md text-sm text-[#615B52] mb-8 leading-relaxed">
        The community hall record or municipal portal page you requested could not be located.
        It may have been moved, renamed, or is currently undergoing schedule updates.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="/halls">
          <Button variant="primary" className="gap-2">
            <Search className="h-4 w-4" />
            Browse Available Halls
          </Button>
        </Link>
        <Link href="/">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
