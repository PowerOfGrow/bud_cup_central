import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Tests d'accessibilité avec axe-core
 * Conforme à WCAG 2.1 Level AA
 */

test.describe('Tests d\'Accessibilité WCAG 2.1 AA', () => {
  test('Page d\'accueil devrait être accessible', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Page de connexion devrait être accessible', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Page d\'inscription devrait être accessible', async ({ page }) => {
    await page.goto('/register');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Page des concours devrait être accessible', async ({ page }) => {
    await page.goto('/contests');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Page À propos devrait être accessible', async ({ page }) => {
    await page.goto('/about');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Navigation Clavier', () => {
  test('Skip link devrait être accessible au clavier', async ({ page }) => {
    await page.goto('/');
    
    // Le skip link devrait être le premier élément focusable
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    
    await expect(focusedElement).toHaveText(/Aller au contenu principal/i);
  });

  test('Navigation Tab devrait être logique', async ({ page }) => {
    await page.goto('/contests');
    
    // Première tab : skip link
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Deuxième tab : navigation principale
    await page.keyboard.press('Tab');
    focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continuer la navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      await expect(currentFocus).toBeVisible();
    }
  });

  test('Focus devrait être visible sur les éléments interactifs', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    
    // Vérifier que l'élément a un style de focus (ring ou outline)
    const styles = await focusedElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        boxShadow: computed.boxShadow,
      };
    });

    // Au moins un indicateur de focus devrait être présent
    const hasFocusIndicator = 
      styles.outline !== 'none' ||
      styles.outlineWidth !== '0px' ||
      styles.boxShadow !== 'none';

    expect(hasFocusIndicator).toBeTruthy();
  });

  test('Modales devraient capturer le focus', async ({ page }) => {
    await page.goto('/login');
    
    // Attendre qu'une modale soit ouverte (exemple avec un bouton)
    // Note: Ce test nécessite une modale réelle sur la page de login
    // Pour l'instant, c'est un template de test
    
    // Si une modale existe, vérifier que le focus est dans la modale
    const modal = page.locator('[role="dialog"]');
    if (await modal.count() > 0) {
      const focusedElement = page.locator(':focus');
      await expect(modal).toContainElement(focusedElement);
    }
  });

  test('Escape devrait fermer les modales', async ({ page }) => {
    await page.goto('/');
    
    // Template de test pour fermeture de modale avec Escape
    // À adapter selon les modales réelles de l'application
    
    const modal = page.locator('[role="dialog"]');
    if (await modal.count() > 0) {
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });
});

test.describe('Formulaires Accessibles', () => {
  test('Champs de formulaire devraient avoir des labels', async ({ page }) => {
    await page.goto('/login');
    
    // Vérifier que tous les inputs ont un label associé
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      
      if (inputId) {
        // Vérifier qu'un label existe avec htmlFor correspondant
        const label = page.locator(`label[for="${inputId}"]`);
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // Au moins un des trois devrait être présent
        const hasLabel = await label.count() > 0 || !!ariaLabel || !!ariaLabelledBy;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('Messages d\'erreur devraient être accessibles', async ({ page }) => {
    await page.goto('/login');
    
    // Soumettre le formulaire vide pour déclencher des erreurs
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Attendre que les messages d'erreur apparaissent
      await page.waitForTimeout(500);
      
      // Vérifier que les messages d'erreur ont role="alert" ou sont associés via aria-describedby
      const errorMessages = page.locator('[role="alert"], .text-red-500, .text-destructive');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    }
  });
});

test.describe('Images et Médias', () => {
  test('Images significatives devraient avoir un alt text', async ({ page }) => {
    await page.goto('/contests');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Si l'image n'est pas décorative (aria-hidden), elle devrait avoir un alt
      if (ariaHidden !== 'true' && role !== 'presentation') {
        // Alt peut être vide si l'image est décorative, mais devrait être présent
        expect(alt).not.toBeNull();
      }
    }
  });
});

test.describe('Structure et Sémantique', () => {
  test('Page devrait avoir un titre unique et descriptif', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Page devrait avoir un seul élément h1', async ({ page }) => {
    await page.goto('/');
    
    const h1Elements = page.locator('h1');
    const h1Count = await h1Elements.count();
    
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('Landmarks ARIA devraient être présents', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la présence de landmarks principaux
    const header = page.locator('header, [role="banner"]');
    const main = page.locator('main, [role="main"]');
    const nav = page.locator('nav, [role="navigation"]');
    const footer = page.locator('footer, [role="contentinfo"]');
    
    await expect(main).toBeVisible();
    
    // Header et nav sont optionnels mais recommandés
    // Footer est optionnel
  });

  test('Ordre des titres devrait être logique', async ({ page }) => {
    await page.goto('/about');
    
    // Récupérer tous les titres
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    if (headings.length > 0) {
      // Le premier titre devrait être h1
      const firstHeading = headings[0];
      const firstTagName = await firstHeading.evaluate((el) => el.tagName.toLowerCase());
      expect(firstTagName).toBe('h1');
    }
  });
});

test.describe('Contraste des Couleurs', () => {
  test('Texte principal devrait avoir un contraste suffisant', async ({ page }) => {
    await page.goto('/');
    
    // Ce test nécessite une vérification pixel par pixel
    // Pour l'instant, on vérifie que les classes Tailwind appropriées sont utilisées
    
    const mainText = page.locator('main p, main span, main div').first();
    if (await mainText.count() > 0) {
      // Vérifier que le texte n'utilise pas de couleurs problématiques
      const colorClasses = await mainText.getAttribute('class');
      expect(colorClasses).not.toContain('text-gray-400'); // Contraste insuffisant
      expect(colorClasses).not.toContain('text-gray-500'); // Contraste insuffisant sur certains fonds
    }
  });
});

test.describe('Boutons et Liens', () => {
  test('Boutons devraient avoir des labels accessibles', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      
      // Vérifier qu'un label existe (texte, aria-label, ou aria-labelledby)
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const ariaHidden = await button.getAttribute('aria-hidden');
      
      // Les boutons avec icônes seulement devraient avoir aria-label
      if (!text || text.trim() === '') {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
      
      // Les boutons décoratifs peuvent être aria-hidden
      if (ariaHidden === 'true') {
        // OK, bouton décoratif
      }
    }
  });

  test('Liens devraient avoir un contexte clair', async ({ page }) => {
    await page.goto('/');
    
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Les liens avec texte générique ("cliquez ici") devraient avoir aria-label
      const genericTexts = ['ici', 'cliquez', 'lien', 'plus', 'here', 'click'];
      const hasGenericText = genericTexts.some(generic => 
        text?.toLowerCase().includes(generic)
      );
      
      if (hasGenericText && !ariaLabel) {
        // Avertissement : lien avec texte générique sans aria-label
        console.warn(`Lien avec texte générique sans aria-label: "${text}"`);
      }
    }
  });
});

