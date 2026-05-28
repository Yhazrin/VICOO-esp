/**
 * Date/time formatting utilities.
 * All display functions respect the user's system timezone.
 */

function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function createFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  return (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const merged: Intl.DateTimeFormatOptions = { ...options, timeZone: getLocalTimeZone() };
    return new Intl.DateTimeFormat(locale, merged).format(d);
  };
}

export function formatDate(date: string | Date, locale = 'en-US'): string {
  return createFormatter(locale, { year: 'numeric', month: 'short', day: 'numeric' })(date);
}

export function formatDateTime(
  date: string | Date,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaults: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return createFormatter(locale, { ...defaults, ...options })(date);
}

export function formatDateShort(date: string | Date, locale = 'en-US'): string {
  return createFormatter(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })(date);
}

export function formatTimestamp(date: string | Date, locale = 'en-US'): string {
  return createFormatter(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })(date);
}

/** Format for input[type="date"] value (YYYY-MM-DD in local time) */
export function toInputDateValue(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', { timeZone: getLocalTimeZone() });
}

/** Format for order ID prefix (YYYYMMDD in local time) */
export function toOrderIdDatePrefix(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', { timeZone: getLocalTimeZone() }).replace(/-/g, '');
}

export const timeZone = getLocalTimeZone();