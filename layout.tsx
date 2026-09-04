import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  weight: ['500', '600', '700'],
});

const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sora',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Puzzle Training',
  description: 'Antrenamentul tău zilnic de puzzle-uri logice',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={`${fraunces.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-ink font-body text-paper">
        {children}
      </body>
    </html>
  );
}
