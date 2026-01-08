import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Runpath Enterprise Solutions',
  description: 'Custom enterprise software that eliminates manual workflows',
  icons: {
    icon: '/RunpathLabs_Logomark.png',
    shortcut: '/RunpathLabs_Logomark.png',
    apple: '/RunpathLabs_Logomark.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} page-loaded`}>{children}</body>
    </html>
  );
}

