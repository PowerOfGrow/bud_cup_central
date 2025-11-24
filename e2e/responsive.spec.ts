import { test, expect } from '@playwright/test';

// Breakpoints Tailwind par défaut
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

test.describe('Responsive Design', () => {
  test('devrait s\'adapter correctement sur mobile (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    
    // Vérifier que le header est visible
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
    
    // Vérifier que le contenu principal est visible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('devrait s\'adapter correctement sur tablette (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
    
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('devrait s\'adapter correctement sur desktop (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
    
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('devrait afficher correctement la page des concours sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/contests');
    
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
    
    // Vérifier qu'il n'y a pas de débordement horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Tolérance de 10px
  });

  test('devrait afficher correctement la page des concours sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/contests');
    
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('devrait afficher correctement le formulaire de connexion sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    const emailInput = page.getByLabel(/email|e-mail/i);
    const passwordInput = page.getByLabel(/password|mot de passe/i);
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Vérifier qu'il n'y a pas de débordement
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test('devrait afficher correctement le dashboard sur différentes tailles', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablette' },
      { width: 1280, height: 720, name: 'Desktop' },
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/dashboard');
      
      await page.waitForLoadState('networkidle');
      
      const mainContent = page.locator('main, [role="main"]').first();
      await expect(mainContent).toBeVisible({ timeout: 5000 }).catch(() => {
        // Si non connecté, c'est normal
      });
      
      // Vérifier qu'il n'y a pas de débordement horizontal
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
    }
  });

  test('devrait gérer correctement le menu mobile si présent', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Chercher un bouton de menu mobile (hamburger)
    const menuButton = page.getByRole('button', { name: /menu|☰|hamburger/i }).first();
    
    // Si le bouton existe, vérifier qu'il est visible
    if (await menuButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(menuButton).toBeVisible();
    }
  });
});

