import { test, expect } from '@playwright/test';

test('A főoldal betöltődik és a cím helyes', async ({ page }) => {
  await page.goto('/');

  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Bajnokság app' }).first()).toBeVisible();

  await expect(page.getByText('Hírek').first()).toBeVisible();
});

test('Admin oldalra navigálás', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await page.getByRole('button', { name: 'Admin bejelentkezés' }).first().click();

  await expect(page).toHaveURL(/.*admin/);
  
  await expect(page.getByText('Bejelentkezés vagy regisztráció').first()).toBeVisible();
});