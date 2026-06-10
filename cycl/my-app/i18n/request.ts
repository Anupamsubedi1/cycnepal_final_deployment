import { getRequestConfig } from 'next-intl/server';
// import { routing } from './routing'; // Recommended to keep config in one place

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the locale if it's a promise
  let locale = await requestLocale;

  // Default to English if locale is missing or unsupported
  if (!locale || !['en', 'ne'].includes(locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});