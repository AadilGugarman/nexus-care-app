import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doctor Directory | Find Healthcare Professionals',
  description: 'Browse our comprehensive directory of qualified doctors and healthcare professionals. Find specialists by location, speciality, and more.',
  keywords: ['doctor directory', 'find doctor', 'healthcare professionals', 'medical specialists', 'doctor search'],
  openGraph: {
    title: 'Doctor Directory | Find Healthcare Professionals',
    description: 'Browse our comprehensive directory of qualified doctors and healthcare professionals.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Doctor Directory',
    description: 'Find qualified healthcare professionals in your area',
  },
};

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
