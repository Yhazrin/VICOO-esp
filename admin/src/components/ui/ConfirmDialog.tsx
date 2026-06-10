import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from './Button';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Default icons based on variant
  const defaultIcon = icon || (
    variant === 'danger' ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ) : variant === 'warning' ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    )
  );

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      width={420}
      footer={
        <div className="confirm-dialog__footer">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel || t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel || t('common.confirm', 'Confirm')}
          </Button>
        </div>
      }
    >
      <div className={`confirm-dialog confirm-dialog--${variant}`}>
        <div className="confirm-dialog__icon">{defaultIcon}</div>
        <h3 className="confirm-dialog__title">{title}</h3>
        {description && <p className="confirm-dialog__description">{description}</p>}
      </div>
    </Modal>
  );
}

// Simplified hook for inline confirmations
interface UseConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean;
    options: UseConfirmOptions | null;
  }>({ open: false, options: null });

  const confirm = React.useCallback((options: UseConfirmOptions) => {
    setState({ open: true, options });
  }, []);

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const ConfirmComponent = () => state.options ? (
    <ConfirmDialog
      open={state.open}
      onClose={close}
      onConfirm={() => {
        state.options?.onConfirm();
        close();
      }}
      title={state.options.title}
      description={state.options.description}
      confirmLabel={state.options.confirmLabel}
      cancelLabel={state.options.cancelLabel}
      variant={state.options.variant}
    />
  ) : null;

  return { confirm, ConfirmComponent };
}