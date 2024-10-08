import type { Metadata } from 'next';
import {UserAttributesContextProvider} from "@/context/userCtx"

export const metadata: Metadata = {
  title: 'List Todos',
  description: 'List Todos',
  robots: 'noindex, nofollow',
};

export default function DahsbaordLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <>
      <UserAttributesContextProvider>
        {children}
      </UserAttributesContextProvider>
      </>
    );
  }