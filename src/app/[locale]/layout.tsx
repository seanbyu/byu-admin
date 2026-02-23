import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { BookingRealtimeListener } from '@/components/realtime/BookingRealtimeListener';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Salon Admin - Salon Booking Management System',
  description: 'Comprehensive booking and management platform for hair salons',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ToastProvider>
              <AuthInitializer />
              <BookingRealtimeListener />
              {children}
            </ToastProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
