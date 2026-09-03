import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Karez 2.0 — PPRA Compliance Engine',
    short_name: 'Karez 2.0',
    description: 'AI-native tender compliance and proposal drafting for Pakistani government procurement under PPRA Rules 2004',
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
    lang: 'en-PK',
  };
}
