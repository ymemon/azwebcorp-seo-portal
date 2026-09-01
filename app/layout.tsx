import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'AZ Web Corp SEO Portal',
    template: '%s | AZ Web Corp',
  },
  description:
    'A secure client reporting portal for Search Console, Analytics and organic growth insights.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: 'AZ Web Corp SEO Portal',
    description: 'Clear SEO performance, live analytics and next actions in one place.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AZ Web Corp SEO Portal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AZ Web Corp SEO Portal',
    description: 'Clear SEO performance, live analytics and next actions in one place.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
