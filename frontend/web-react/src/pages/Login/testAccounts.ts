export interface TestAccount {
  id: string;
  roleKey: string;
  email: string;
  password: string;
  hintKey?: string;
}

/** Demo credentials from backend seed (local / development). */
export const WEBSITE_TEST_ACCOUNTS: TestAccount[] = [
  {
    id: 'admin',
    roleKey: 'login.testAccounts.roles.admin',
    email: 'admin@tonghua.org',
    password: 'vicoo-admin',
    hintKey: 'login.testAccounts.hints.admin',
  },
  {
    id: 'user',
    roleKey: 'login.testAccounts.roles.user',
    email: 'lihua@example.com',
    password: 'vicoo-user',
    hintKey: 'login.testAccounts.hints.user',
  },
];

/** Separate admin SPA (deploy/easy — port 8080), not this login form. */
export const ADMIN_PANEL_ACCOUNT: TestAccount = {
  id: 'admin-panel',
  roleKey: 'login.testAccounts.roles.adminPanel',
  email: 'admin@vicoo.org',
  password: 'vicoo-admin',
  hintKey: 'login.testAccounts.hints.adminPanel',
};
