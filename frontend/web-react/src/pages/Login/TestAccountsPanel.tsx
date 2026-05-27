import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { TestAccount } from './testAccounts';
import { ADMIN_PANEL_ACCOUNT, WEBSITE_TEST_ACCOUNTS } from './testAccounts';

interface TestAccountsPanelProps {
  onSelect: (account: TestAccount) => void;
  onClose: () => void;
}

function AccountRow({
  account,
  onSelect,
  fillOnClick = true,
}: {
  account: TestAccount;
  onSelect: (account: TestAccount) => void;
  fillOnClick?: boolean;
}) {
  const { t } = useTranslation();

  const copyField = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('login.testAccounts.copied', '已复制'));
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`rounded-2xl border border-warm-gray/25 bg-white/55 overflow-hidden ${
        fillOnClick ? 'hover:border-rust/20 hover:bg-white/75 transition-colors' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (fillOnClick) onSelect(account);
        }}
        disabled={!fillOnClick}
        className={`w-full text-left px-4 pt-4 pb-3 ${
          fillOnClick ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="font-body text-sm tracking-[0.06em] text-ink font-medium">
            {t(account.roleKey)}
          </span>
          {fillOnClick && (
            <span className="shrink-0 font-body text-xs text-rust/80 bg-rust/[0.08] px-2.5 py-1 rounded-full">
              {t('login.testAccounts.fillForm', '点击填入')}
            </span>
          )}
        </div>
        {account.hintKey && (
          <p className="font-body text-sm text-ink-faded/75 mb-3 leading-relaxed">
            {t(account.hintKey)}
          </p>
        )}
        <dl className="space-y-2.5 rounded-xl bg-aged-stock/50 px-3.5 py-3">
          <div>
            <dt className="font-body text-xs uppercase tracking-wider text-sepia-mid/80 mb-1">
              {t('login.email')}
            </dt>
            <dd className="font-mono text-sm text-ink break-all leading-snug">{account.email}</dd>
          </div>
          <div>
            <dt className="font-body text-xs uppercase tracking-wider text-sepia-mid/80 mb-1">
              {t('login.password')}
            </dt>
            <dd className="font-mono text-sm text-ink leading-snug">{account.password}</dd>
          </div>
        </dl>
      </button>
      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={() => void copyField(account.email)}
          className="font-body text-xs text-sepia-mid hover:text-rust px-3 py-1.5 rounded-full border border-warm-gray/25 bg-white/60 transition-colors cursor-pointer"
        >
          {t('login.testAccounts.copyEmail', '复制邮箱')}
        </button>
        <button
          type="button"
          onClick={() => void copyField(account.password)}
          className="font-body text-xs text-sepia-mid hover:text-rust px-3 py-1.5 rounded-full border border-warm-gray/25 bg-white/60 transition-colors cursor-pointer"
        >
          {t('login.testAccounts.copyPassword', '复制密码')}
        </button>
      </div>
    </div>
  );
}

function PanelBody({
  onSelect,
  onClose,
  className = '',
}: {
  onSelect: (account: TestAccount) => void;
  onClose: () => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="pr-6">
          <p className="font-display text-xl text-ink leading-tight">
            {t('login.testAccounts.title')}
          </p>
          <p className="font-body text-sm text-ink-faded/75 mt-1.5 leading-relaxed">
            {t('login.testAccounts.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-sepia-mid/60 hover:text-ink p-1.5 rounded-full hover:bg-aged-stock/60 transition-colors cursor-pointer"
          aria-label={t('login.testAccounts.close')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 max-h-[min(70vh,480px)] overflow-y-auto pr-0.5">
        {WEBSITE_TEST_ACCOUNTS.map((account) => (
          <AccountRow key={account.id} account={account} onSelect={onSelect} />
        ))}

        <div className="pt-1">
          <p className="font-body text-xs uppercase tracking-[0.12em] text-sepia-mid/70 mb-2.5">
            {t('login.testAccounts.adminPanelSection')}
          </p>
          <AccountRow account={ADMIN_PANEL_ACCOUNT} onSelect={onSelect} fillOnClick={false} />
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center font-body text-sm text-rust hover:underline"
          >
            {t('login.testAccounts.openAdminPanel')} →
          </a>
        </div>
      </div>
    </div>
  );
}

export function TestAccountsPanel({ onSelect, onClose }: TestAccountsPanelProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
        className="fixed top-5 right-5 z-50 w-[min(100vw-2rem,360px)] rounded-[24px] border border-white/50 bg-white/80 backdrop-blur-2xl shadow-xl shadow-ink/[0.08] px-5 py-5 md:hidden"
      >
        <PanelBody onSelect={onSelect} onClose={onClose} />
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, x: 16, width: 0 }}
        animate={{ opacity: 1, x: 0, width: 'auto' }}
        exit={{ opacity: 0, x: 16, width: 0 }}
        transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
        className="hidden md:block overflow-hidden shrink-0"
      >
        <div className="w-[min(360px,38vw)] rounded-[24px] border border-warm-gray/30 bg-white/60 backdrop-blur-2xl shadow-lg shadow-ink/[0.06] px-6 py-6 ml-4">
          <PanelBody onSelect={onSelect} onClose={onClose} />
        </div>
      </motion.aside>
    </>
  );
}
