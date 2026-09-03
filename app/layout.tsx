import type { Metadata, Viewport } from 'next';
import '../lib/polyfill-fetch';
import './globals.css'; // Global styles
import { AuthProvider } from '../contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Karez 2.0 — PPRA 2004 Compliance Engine',
  description: 'AI-native procurement compliance & disqualification prevention platform for Pakistani construction tenders (NHA, LDA, C&W, WAPDA) bound by PPRA Rules 2004.',
  openGraph: {
    title: 'Karez 2.0 — PPRA 2004 Compliance Engine',
    description: 'AI-native procurement compliance & disqualification prevention platform for Pakistani construction tenders bound by PPRA Rules 2004.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karez 2.0 — PPRA 2004 Compliance Engine',
    description: 'AI-native procurement compliance & disqualification prevention platform for Pakistani construction tenders bound by PPRA Rules 2004.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Karez 2.0',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  try {
                    var origFetch = window.fetch;
                    var currentFetch = origFetch;
                    Object.defineProperty(window, 'fetch', {
                      get: function() {
                        return currentFetch;
                      },
                      set: function(val) {
                        currentFetch = val;
                      },
                      configurable: true,
                      enumerable: true
                    });
                  } catch(e) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

