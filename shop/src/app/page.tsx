import React from 'react';
import type { Metadata } from 'next';
import { BRAND } from '@/config/branding';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  alternates: {
    canonical: `${BRAND.domain}/`,
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
