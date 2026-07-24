import type { Metadata } from 'next';
import { noIndexRobots } from '@/lib/seo';

export const metadata: Metadata = {
  robots: noIndexRobots,
};

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
