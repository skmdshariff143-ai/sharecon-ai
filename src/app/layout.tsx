import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShaRecon AI — Explainable Reconciliation & Financial Control',
  description:
    'Explainable 3-way financial reconciliation prototype for Razorpay payments, settlements, and bank credits with grounded AI exception analysis.',
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
