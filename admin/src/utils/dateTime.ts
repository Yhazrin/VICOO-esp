/**
 * Date/time formatting utilities for admin panel.
 * All display functions respect the user's system timezone.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  return dayjs.utc(date).tz(dayjs.tz.guess()).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs.utc(date).tz(dayjs.tz.guess()).format('YYYY-MM-DD HH:mm');
}

export function formatDateTimeFull(date: string | Date): string {
  return dayjs.utc(date).tz(dayjs.tz.guess()).format('YYYY-MM-DD HH:mm:ss');
}

export function formatTimestamp(date: string | Date): string {
  return dayjs.utc(date).tz(dayjs.tz.guess()).format('YYYYMMDD_HHmmss');
}

export const timeZone = dayjs.tz.guess();