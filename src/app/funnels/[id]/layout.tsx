import { ReactNode } from 'react';

// Force dynamic rendering - disable all caching for live funnel data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function FunnelDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
