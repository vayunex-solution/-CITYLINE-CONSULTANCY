import React from 'react';
import type { Metadata } from 'next';
import { TestimonialsManager } from '@/components/admin/testimonials/TestimonialsManager';

export const metadata: Metadata = {
  title: 'Admin: Testimonials Management | Cityline Consultancy',
  description: 'Manage, curate, reorder, and publish verified client testimonials.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminTestimonialsPage() {
  return (
    <main style={{ minHeight: '80vh', paddingTop: 'var(--space-20)', paddingBottom: 'var(--space-20)' }}>
      <TestimonialsManager />
    </main>
  );
}
