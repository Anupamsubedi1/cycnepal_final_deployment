export function withLocalePath(locale: string, href: string): string {
  if (!href.startsWith("/")) {
    return href;
  }

  if (href === "/") {
    return `/${locale}`;
  }

  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) {
    return href;
  }

  return `/${locale}${href}`;
}