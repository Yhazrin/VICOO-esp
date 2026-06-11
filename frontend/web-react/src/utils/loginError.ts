import type { TFunction } from 'i18next';

/** Extract human-readable error text from a FastAPI / custom API error body. */
export function extractApiErrorDetail(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;
  if (typeof record.message === 'string') return record.message;
  return undefined;
}

export function isAccountBannedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('banned') || lower.includes('disabled') || message.includes('禁用');
}

export function localizeLoginErrorMessage(message: string | undefined, t: TFunction): string {
  if (!message) {
    return t('login.error.invalidCredentials', 'Invalid email or password');
  }
  if (isAccountBannedMessage(message)) {
    return t('login.error.accountBanned', 'This account has been disabled and cannot sign in.');
  }
  if (message === 'Invalid credentials') {
    return t('login.error.invalidCredentials', 'Invalid email or password');
  }
  if (message === 'User not found') {
    return t('login.error.userNotFound', 'User not found');
  }
  return message;
}
