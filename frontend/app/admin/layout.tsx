import React from 'react';
import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/lib/admin/admin-auth';
import { AdminShell } from '@/components/admin/layout/AdminShell';

export const metadata: Metadata = {
  title: 'Admin Console | Cityline Consultancy',
  description: 'Operational management console for Cityline Consultancy.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
