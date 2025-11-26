/**
 * Development Mode Banner - Shows when demo data is active
 * Provides clear indication to users when using test analytics
 */

import { memo, type FC } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DevelopmentModeBannerProps {
  show: boolean;
}

export const DevelopmentModeBanner: FC<DevelopmentModeBannerProps> = memo(({ show }) => {
  if (!show || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Alert className="bg-accent-blue/10 border-accent-blue/20 text-accent-blue mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Development Mode:</strong> You're viewing demo analytics data for testing purposes.
        This includes sample revenue, bookings, and customer data.
      </AlertDescription>
    </Alert>
  );
});
DevelopmentModeBanner.displayName = 'DevelopmentModeBanner';

export default DevelopmentModeBanner;
