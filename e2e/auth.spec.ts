import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('devrait afficher le bouton de connexion quand non connecté', async ({ page }) => {
    await expect(page.getByRole('button', { name: /connexion|login/i })).toBeVisible();
  });

  test('devrait naviguer vers la page de connexion', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /connexion|login/i }).first();
    await loginButton.click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email|e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/password|mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter|sign in/i })).toBeVisible();
  });

  test('devrait afficher le formulaire d\'inscription', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/email|e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/password|mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /s'inscrire|sign up/i })).toBeVisible();
  });

  test('devrait afficher les sélecteurs de rôle dans le formulaire d\'inscription', async ({ page }) => {
    await page.goto('/register');
    // Vérifier la présence des options de rôle
    await expect(page.getByText(/viewer|membre gratuit/i)).toBeVisible();
    await expect(page.getByText(/producer|producteur/i)).toBeVisible();
    await expect(page.getByText(/judge|juge/i)).toBeVisible();
    await expect(page.getByText(/organizer|organisateur/i)).toBeVisible();
  });
});

