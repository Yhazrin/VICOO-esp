import type { TFunction } from 'i18next';

import { extractApiErrorDetail } from './loginError';

/** Backend error codes the register endpoint can return. Keep in sync with
 *  `app/core/errors.py` and `i18n/{en,zh}.json` `register.errors.*` keys. */
export type RegisterErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_NICKNAME'
  | 'INVALID_PHONE'
  | 'RATE_LIMITED'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_SERVER_ERROR'
  | 'HTTP_400'
  | 'HTTP_500';

/** Lookup table from backend `code` → i18n key. Falling through to the legacy
 *  `userExists` message preserves the old behaviour for any stale 4xx with a
 *  detail string of "already exists". */
const CODE_TO_I18N_KEY: Record<RegisterErrorCode, string> = {
  EMAIL_ALREADY_EXISTS: 'register.errors.emailAlreadyExists',
  WEAK_PASSWORD: 'register.errors.weakPassword',
  INVALID_NICKNAME: 'register.errors.invalidNickname',
  INVALID_PHONE: 'register.errors.invalidPhone',
  RATE_LIMITED: 'register.errors.rateLimited',
  VALIDATION_FAILED: 'register.errors.validationFailed',
  INTERNAL_SERVER_ERROR: 'register.errors.internalError',
  HTTP_400: 'register.errors.internalError',
  HTTP_500: 'register.errors.internalError',
};

/** Try to extract a structured error code from an Axios error response. */
export function extractRegisterErrorCode(error: unknown): RegisterErrorCode | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const response = (error as { response?: { data?: { code?: unknown } } }).response;
  const code = response?.data?.code;
  if (typeof code === 'string' && code in CODE_TO_I18N_KEY) {
    return code as RegisterErrorCode;
  }
  return undefined;
}

const PASSWORD_TOO_LONG_HINT = '72';

export function localizeRegisterErrorMessage(
  error: unknown,
  t: TFunction,
): string {
  const code = extractRegisterErrorCode(error);
  if (code) {
    return t(CODE_TO_I18N_KEY[code], t('register.errors.internalError'));
  }

  const message = extractApiErrorDetail(
    (error as { response?: { data?: unknown } })?.response?.data,
  );

  if (message) {
    if (message.toLowerCase().includes('already exists')) {
      return t('register.errors.emailAlreadyExists');
    }
    if (message.toLowerCase().includes('too long') || message.includes(PASSWORD_TOO_LONG_HINT)) {
      return t('register.errors.passwordTooLong');
    }
    if (message.toLowerCase().includes('weak')) {
      return t('register.errors.weakPassword');
    }
    return message;
  }

  return t('register.errors.internalError');
}
