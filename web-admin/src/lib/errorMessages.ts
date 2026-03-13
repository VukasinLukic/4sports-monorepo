import type { TFunction } from 'i18next';

/**
 * Maps Firebase auth error codes to user-friendly i18n messages.
 */
export function getFirebaseErrorMessage(errorCode: string, t: TFunction): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': t('errors.emailAlreadyInUse'),
    'auth/invalid-email': t('errors.invalidEmail'),
    'auth/weak-password': t('errors.weakPassword'),
    'auth/user-not-found': t('errors.userNotFound'),
    'auth/wrong-password': t('errors.wrongPassword'),
    'auth/invalid-credential': t('errors.invalidCredentials'),
    'auth/too-many-requests': t('errors.tooManyRequests'),
    'auth/network-request-failed': t('errors.networkError'),
    'auth/user-disabled': t('errors.accountDisabled'),
  };
  return map[errorCode] || t('errors.genericError');
}

/**
 * Maps API/Axios errors to user-friendly i18n messages.
 */
export function getApiErrorMessage(error: any, t: TFunction): string {
  if (error.response) {
    const status = error.response.status;
    if (status === 400) return error.response.data?.error?.message || t('errors.badRequest');
    if (status === 403) return t('errors.forbidden');
    if (status === 404) return t('errors.notFound');
    if (status >= 500) return t('errors.serverError');
  }
  if (error.code === 'ERR_NETWORK') return t('errors.networkError');
  return t('errors.genericError');
}
