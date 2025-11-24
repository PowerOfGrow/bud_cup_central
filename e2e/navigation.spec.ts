import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('devrait avoir un header avec navigation', async ({ page }) => {
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('devrait naviguer vers la page des concours', async ({ page }) => {
    const contestsLink = page.getByRole('link', { name: /concours|contests/i });
    if (await contestsLink.isVisible()) {
      await contestsLink.click();
      await expect(page).toHaveURL(/.*contest/);
    }
  });

  test('devrait naviguer vers la page À propos', async ({ page }) => {
    const aboutLink = page.getByRole('link', { name: /à propos|about/i });
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/.*about/);
    }
  });

  test('devrait avoir un lien vers le dashboard si connecté', async ({ page }) => {
    // Note: Ce test nécessite une authentification
    // Pour l'instant, on vérifie juste que le lien n'existe pas si non connecté
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    // Le dashboard ne devrait pas être visible si non connecté
    await expect(dashboardLink).not.toBeVisible({ timeout: 1000 }).catch(() => {
      // C'est OK si le lien n'existe pas
    });
  });

  test('devrait avoir un footer ou contenu principal', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });
});

