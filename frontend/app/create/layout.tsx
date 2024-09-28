import type { Metadata } from 'next';
import {UserAttributesContextProvider} from '@/context/userCtx';

export const metadata: Metadata = {
  title: 'New Request',
  description: 'Request A Substitute',
  robots: 'noindex, nofollow',
};

export default function RequestsLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <UserAttributesContextProvider>
        {children}
      </UserAttributesContextProvider>
    );
  }