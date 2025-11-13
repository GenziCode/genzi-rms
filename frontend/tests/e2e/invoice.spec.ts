import { test } from '@playwright/test';

test.describe('Invoice delivery flow', () => {
  test.skip(true, 'Pending staging credentials and seeded data');

  test('user can create invoice and send email', async ({ page }) => {
    await page.goto('/');
    // Placeholder – real flow implemented once staging creds wired.
  });
});


