import React from 'react';
import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/lib/admin/admin-auth';
import { AdminShell } from '@/components/admin/layout/AdminShell';

export const metadata: Metadata = {
  title: 'Admin Console | Cityline Consultancy',
  description: 'Operational management console for Cityline Consultancy.',
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
