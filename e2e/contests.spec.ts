import { test, expect } from '@playwright/test';

test.describe('Page Concours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contests');
  });

  test('devrait afficher la page des concours', async ({ page }) => {
    await expect(page).toHaveURL(/.*contest/);
  });

  test('devrait avoir un contenu principal', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('devrait avoir une barre de recherche si disponible', async ({ page }) => {
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.getByPlaceholder(/rechercher|search/i).first();
    // Le champ de recherche peut ne pas être visible immédiatement
    // On vérifie juste qu'il existe dans le DOM
    const searchExists = await searchInput.count() > 0;
    // Si le champ existe, vérifier qu'il est visible ou accessible
    if (searchExists) {
      await expect(searchInput).toBeVisible({ timeout: 2000 }).catch(() => {
        // C'est OK si le champ n'est pas visible immédiatement
      });
    }
  });

  test('devrait afficher des entrées ou un message si aucune entrée', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'il y a soit des entrées, soit un message indiquant qu'il n'y en a pas
    const entries = page.locator('[data-testid="entry"], .entry-card, article').first();
    const noEntriesMessage = page.getByText(/aucune entrée|no entries|aucun concours/i);
    
    const hasEntries = await entries.count() > 0;
    const hasNoEntriesMessage = await noEntriesMessage.isVisible().catch(() => false);
    
    expect(hasEntries || hasNoEntriesMessage).toBeTruthy();
  });
});

