import { test, expect } from '@playwright/test';

test('A főoldal betöltődik és a cím helyes', async ({ page }) => {
  // 1. Megnyitjuk a főoldalt
  await page.goto('/');

  // VÁRAKOZÁS: Biztosítjuk, hogy az oldal teljesen betöltődjön
  await page.waitForLoadState('networkidle');

  // 2. Ellenőrizzük a címet. 
  // Mivel többször szerepel, a .first()-et használjuk!
  await expect(page.getByRole('heading', { name: 'Bajnokság app' }).first()).toBeVisible();

  // 3. Ellenőrizzük a Hírek szekciót
  // Itt is lehet több találat, ezért .first()
  await expect(page.getByText('Hírek').first()).toBeVisible();
});

test('Admin oldalra navigálás', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Rákattintunk az Admin gombra (itt is az elsőt választjuk a biztonság kedvéért)
  await page.getByRole('button', { name: 'Admin bejelentkezés' }).first().click();

  // Ellenőrizzük, hogy átirányított-e
  await expect(page).toHaveURL(/.*admin/);
  
  // Ellenőrizzük az admin oldali címet
  await expect(page.getByText('Bejelentkezés vagy regisztráció').first()).toBeVisible();
});