const DEFAULT_SITE_URL = 'https://nba-reference.com';

function normalizeSiteUrl(value: string | undefined): string {
  const trimmedValue = value?.trim();
  if (trimmedValue == null || trimmedValue.length === 0) {
    return DEFAULT_SITE_URL;
  }

  const candidate = /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;

  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env['NEXT_PUBLIC_SITE_URL']);
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}
