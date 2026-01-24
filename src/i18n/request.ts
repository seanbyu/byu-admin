import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale: locale as string,
    messages: {
      common: (await import(`../messages/${locale}/common.json`)).default,
      auth: (await import(`../messages/${locale}/auth.json`)).default,
      nav: (await import(`../messages/${locale}/nav.json`)).default,
      booking: (await import(`../messages/${locale}/booking.json`)).default,
      customer: (await import(`../messages/${locale}/customer.json`)).default,
      staff: (await import(`../messages/${locale}/staff.json`)).default,
      menu: (await import(`../messages/${locale}/menu.json`)).default,
      review: (await import(`../messages/${locale}/review.json`)).default,
      sales: (await import(`../messages/${locale}/sales.json`)).default,
      salon: (await import(`../messages/${locale}/salon.json`)).default,
      chat: (await import(`../messages/${locale}/chat.json`)).default,
      settings: (await import(`../messages/${locale}/settings.json`)).default,
    },
  };
});
