import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppProviders } from '@/components/providers';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} - Personal Budgeting App`,
  description: `Track your finances, set budget goals, and gain insights into your spending habits with ${APP_NAME}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
