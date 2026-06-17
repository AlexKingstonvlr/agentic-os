import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PWAPrompt } from '@/components/PWAPrompt';

export const metadata: Metadata = {
  title: 'Agentic OS',
  description: 'Open-source multi-agent operating system for AI agents.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <PWAPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
