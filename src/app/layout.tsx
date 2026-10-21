import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#070a10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const baseUrl = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN) : new URL('https://sharecon-ai.vercel.app');

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: 'ShaRecon AI — Explainable Reconciliation & Financial Control',
    template: '%s | ShaRecon AI',
  },
  description:
    'Explainable 3-way financial reconciliation operations control center matching Razorpay payments, settlements, and bank statement credits with integer-paise arithmetic and grounded AI exception analysis.',
  keywords: [
    'reconciliation',
    'financial controller',
    'Razorpay',
    'three-way reconciliation',
    'ISO 20022',
    'CAMT.053',
    'fintech',
    'audit ledger',
    'paise arithmetic',
    'AI finance',
  ],
  authors: [{ name: 'ShaRecon AI Engineering Team' }],
  creator: 'ShaRecon AI',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ShaRecon AI — Explainable Reconciliation & Financial Control',
    description:
      'Explainable 3-way financial reconciliation operations control center matching Razorpay payments, settlements, and bank statement credits with integer-paise arithmetic.',
    url: baseUrl,
    siteName: 'ShaRecon AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShaRecon AI — Explainable Reconciliation & Financial Control',
    description:
      'Explainable 3-way financial reconciliation operations control center matching Razorpay payments, settlements, and bank statement credits.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-screen dark-app-canvas bg-[#070a10] text-[#f7f8fc] antialiased selection:bg-[#7168ff] selection:text-white">
        {children}
      </body>
    </html>
  );
}
