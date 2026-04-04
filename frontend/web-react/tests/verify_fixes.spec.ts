import { test, expect } from '@playwright/test';

test('Language state persistence', async ({ page }) => {
  await page.goto('http://localhost/');
  
  // Find the language toggle button
  const langButton = page.locator('button[aria-label="Toggle language"]');
  await expect(langButton).toBeVisible();
  
  const initialText = await langButton.innerText();
  if (initialText.includes('CN')) {
    await langButton.click();
    // In Chinese, the button says "英文" (English)
    await expect(langButton).toHaveText(/英文/);
  } else {
    // Already in Chinese
    await expect(langButton).toHaveText(/英文/);
  }
  
  // Refresh the page
  await page.reload();
  
  // Check if it's still Chinese
  await expect(langButton).toHaveText(/英文/);
});

test('Donation page works (no 500 error)', async ({ page }) => {
  await page.goto('http://localhost/donate');
  await expect(page.locator('h1')).toBeVisible();
});

test('Login error handling and localization', async ({ page }) => {
  await page.goto('http://localhost/login');
  
  // Try to login with wrong credentials
  await page.fill('input[type="email"]', 'wrong@example.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  
  // Check for error message
  const errorAlert = page.locator('div[role="alert"]');
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert).toHaveClass(/text-rust/);
  
  // Check localization (depends on current language)
  const langButton = page.locator('button[aria-label="Toggle language"]');
  const langText = await langButton.innerText();
  
  if (langText.includes('英文')) {
    // It's Chinese
    await expect(errorAlert).toHaveText(/邮箱或密码错误/);
  } else {
    // It's English
    await expect(errorAlert).toHaveText(/Invalid email or password/);
  }
});
