import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ShaRecon AI — Financial Reconciliation Controller',
    short_name: 'ShaRecon AI',
    description: 'Explainable 3-Way Financial Reconciliation Operations Control Center',
    start_url: '/',
    display: 'standalone',
    background_color: '#070a10',
    theme_color: '#0e131f',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
