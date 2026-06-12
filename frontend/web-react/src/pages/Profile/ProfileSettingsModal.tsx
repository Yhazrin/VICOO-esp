import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import type { TFunction } from 'i18next';
import { authApi } from '@/services/auth';
import { uploadUserImage } from '@/services/uploads';
import { useAuthStore } from '@/stores/authStore';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import type { User } from '@/types';

interface ProfileSettingsModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onError: (message: string) => void;
}

function mapProfileSaveError(error: unknown, t: TFunction): string {
  if (error instanceof AxiosError) {
    const code = error.response?.data?.code as string | undefined;
    const errors: Record<string, string> = {
      WRONG_CURRENT_PASSWORD: t('profile.settings.errors.wrongPassword', 'Current password is incorrect'),
      EMAIL_ALREADY_EXISTS: t('profile.settings.errors.emailExists', 'This email is already registered'),
      WEAK_PASSWORD: t('profile.settings.errors.weakPassword', 'Password is too weak'),
      OAUTH_ONLY_ACCOUNT: t('profile.settings.errors.oauthOnly', 'Social login account — set a password via forgot-password first'),
    };
    if (code && errors[code]) return errors[code];
    if (typeof error.response?.data?.message === 'string') {
      return error.response.data.message;
    }
  }
  return t('profile.settings.saveError', 'Failed to save profile — please retry');
}

function validateNewPassword(password: string, t: TFunction): string | null {
  if (!password) return null;
  if (password.length < 8) {
    return t('register.errors.passwordTooShort', 'Password must be at least 8 characters');
  }
  if (password.length > 128) {
    return t('register.errors.passwordTooLong', 'Password is too long. Please use at most 128 characters.');
  }
  return null;
}

export default function ProfileSettingsModal({
  user,
  open,
  onClose,
  onError,
}: ProfileSettingsModalProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const updateUser = useAuthStore((s) => s.updateUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user.nickname || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNickname(user.nickname || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNewPasswordTouched(false);
      setConfirmPasswordTouched(false);
      setAvatarPreview(user.avatarUrl ?? null);
      setPendingAvatarUrl(null);
      // Prevent browser autofill from pre-filling password on open
      requestAnimationFrame(() => {
        if (currentPasswordRef.current) {
          currentPasswordRef.current.value = '';
        }
      });
    }
  }, [open, user]);

  const emailChanged = email.trim().toLowerCase() !== (user.email || '').toLowerCase();
  const nicknameChanged = nickname.trim() !== (user.nickname || '').trim();
  const avatarChanged = pendingAvatarUrl !== null;
  const wantsPasswordChange = newPassword.length > 0;
  const hasProfileChanges = nicknameChanged || emailChanged || avatarChanged || wantsPasswordChange;
  const needsCurrentPassword = emailChanged || wantsPasswordChange;
  const newPasswordError =
    (newPasswordTouched || wantsPasswordChange) && newPassword
      ? validateNewPassword(newPassword, t)
      : null;
  const confirmPasswordError =
    confirmPasswordTouched && wantsPasswordChange && confirmPassword !== newPassword
      ? t('profile.settings.errors.passwordMismatch', 'New passwords do not match')
      : null;
  const hasPasswordValidationError = Boolean(newPasswordError || confirmPasswordError);
  const passwordChangeIncomplete =
    wantsPasswordChange && (!confirmPassword || newPassword !== confirmPassword);
  const canSave =
    hasProfileChanges
    && (!needsCurrentPassword || currentPassword.trim().length > 0)
    && !passwordChangeIncomplete
    && !hasPasswordValidationError;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (needsCurrentPassword && !currentPassword) {
        throw new Error(t('profile.settings.errors.currentPasswordRequired', 'Current password is required'));
      }
      if (wantsPasswordChange && newPassword !== confirmPassword) {
        setConfirmPasswordTouched(true);
        throw new Error(t('profile.settings.errors.passwordMismatch', 'New passwords do not match'));
      }
      const pwdError = validateNewPassword(newPassword, t);
      if (wantsPasswordChange && pwdError) {
        setNewPasswordTouched(true);
        throw new Error(pwdError);
      }

      const payload: Parameters<typeof authApi.updateProfile>[0] = {
        nickname: nickname.trim(),
      };
      if (pendingAvatarUrl) payload.avatar = pendingAvatarUrl;
      if (emailChanged) payload.email = email.trim();
      if (wantsPasswordChange) payload.new_password = newPassword;
      if (needsCurrentPassword) payload.current_password = currentPassword;

      return authApi.updateProfile(payload);
    },
    onSuccess: (updated) => {
      updateUser(updated);
      onClose();
    },
    onError: (error) => {
      if (error instanceof Error && !(error instanceof AxiosError)) {
        onError(error.message);
        return;
      }
      onError(mapProfileSaveError(error, t));
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { url } = await uploadUserImage(file);
      setPendingAvatarUrl(url);
      setAvatarPreview(url);
    } catch {
      onError(t('profile.settings.avatarUploadError', 'Avatar upload failed — please retry'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const displayAvatar = avatarPreview ? resolveMediaUrl(avatarPreview) : null;
  const initial = (nickname || user.email).charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-settings-title"
        >
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-paper border border-warm-gray/30 p-8 relative"
          >
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

            <div className="flex items-center justify-between mb-6">
              <h2 id="profile-settings-title" className="font-display text-xl text-ink">
                {t('profile.settings.title', 'Edit Profile')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-sepia-mid hover:text-ink cursor-pointer text-xl leading-none"
                aria-label={t('common.close', 'Close')}
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative w-20 h-20 bg-warm-gray/20 flex items-center justify-center border-2 border-rust/20 overflow-hidden cursor-pointer disabled:opacity-60"
                aria-label={t('profile.settings.changeAvatar', 'Change avatar')}
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-2xl text-ink">{initial}</span>
                )}
                {uploadingAvatar && (
                  <span className="absolute inset-0 bg-ink/30 flex items-center justify-center">
                    <span className="font-body text-[10px] text-paper uppercase tracking-wider">
                      {t('common.loading', 'Loading...')}
                    </span>
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
              <p className="font-body text-caption text-sepia-mid mt-2">
                {t('profile.settings.avatarHint', 'Click to upload a new avatar')}
              </p>
            </div>

            <div className="space-y-4" autoComplete="off">
              {/* Decoy fields — reduce browser autofill on real password inputs */}
              <input type="text" name="prevent_autofill_username" className="hidden" tabIndex={-1} aria-hidden="true" />
              <input type="password" name="prevent_autofill_password" className="hidden" tabIndex={-1} aria-hidden="true" />

              <div>
                <label htmlFor="profile-nickname" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">
                  {t('register.nickname', 'Nickname')}
                </label>
                <input
                  id="profile-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">
                  {t('register.email', 'Email')}
                </label>
                <input
                  id="profile-email"
                  type="email"
                  name="profile-email-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50"
                />
              </div>

              <div className="pt-2 border-t border-warm-gray/20">
                <p className="font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-3">
                  {t('profile.settings.securitySection', 'Security')}
                </p>
                <p className="font-body text-caption text-ink-faded mb-4">
                  {t('profile.settings.securityHint', 'Required when changing email or password')}
                </p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="profile-current-password" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">
                      {t('profile.settings.currentPassword', 'Current password')}
                    </label>
                    <input
                      ref={currentPasswordRef}
                      id="profile-current-password"
                      type="password"
                      name="profile-current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
                      placeholder={t('profile.settings.currentPasswordPlaceholder', 'Enter your current login password')}
                      className="w-full px-3 py-2 border border-warm-gray/30 bg-transparent font-body text-body-sm text-ink focus:outline-none focus:border-rust/50 placeholder:text-ink-faded/60"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-new-password" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">
                      {t('profile.settings.newPassword', 'New password')}
                    </label>
                    <input
                      id="profile-new-password"
                      type="password"
                      name="profile-new-password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (!newPasswordTouched) setNewPasswordTouched(true);
                      }}
                      onBlur={() => setNewPasswordTouched(true)}
                      autoComplete="off"
                      placeholder={t('profile.settings.newPasswordPlaceholder', 'Leave blank to keep unchanged')}
                      aria-invalid={Boolean(newPasswordError)}
                      aria-describedby={newPasswordError ? 'profile-new-password-error' : 'profile-new-password-hint'}
                      className={`w-full px-3 py-2 border bg-transparent font-body text-body-sm text-ink focus:outline-none placeholder:text-ink-faded/60 ${
                        newPasswordError ? 'border-rust/50' : 'border-warm-gray/30 focus:border-rust/50'
                      }`}
                    />
                    <p id="profile-new-password-hint" className="font-body text-caption text-ink-faded mt-1.5">
                      {t('profile.settings.passwordRules', 'At least 8 characters')}
                    </p>
                    {newPasswordError && (
                      <p id="profile-new-password-error" className="font-body text-caption text-rust mt-1" role="alert">
                        {newPasswordError}
                      </p>
                    )}
                  </div>

                  {wantsPasswordChange && (
                    <div>
                      <label htmlFor="profile-confirm-password" className="block font-body text-[10px] tracking-wider uppercase text-sepia-mid mb-1">
                        {t('register.confirmPassword', 'Confirm Password')}
                      </label>
                      <input
                        id="profile-confirm-password"
                        type="password"
                        name="profile-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
                        }}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        autoComplete="off"
                        aria-invalid={Boolean(confirmPasswordError)}
                        className={`w-full px-3 py-2 border bg-transparent font-body text-body-sm text-ink focus:outline-none ${
                          confirmPasswordError ? 'border-rust/50' : 'border-warm-gray/30 focus:border-rust/50'
                        }`}
                      />
                      {confirmPasswordError && (
                        <p className="font-body text-caption text-rust mt-1" role="alert">
                          {confirmPasswordError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={
                  saveMutation.isPending
                  || uploadingAvatar
                  || !nickname.trim()
                  || !email.trim()
                  || !canSave
                }
                className="flex-1 font-body text-label tracking-wide bg-ink text-paper px-6 py-2.5 hover:bg-rust transition-colors cursor-pointer disabled:opacity-40"
              >
                {saveMutation.isPending ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-body text-label tracking-wide text-sepia-mid hover:text-ink transition-colors cursor-pointer px-4"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
