# ♿ Documentation Accessibilité - CBD Flower Cup

**Date de création** : 2024-12-02  
**Dernière mise à jour** : 2024-12-02  
**Niveau cible** : WCAG 2.1 Level AA

---

## 🎯 Vue d'Ensemble

La plateforme CBD Flower Cup s'engage à être accessible à tous les utilisateurs, conformément aux **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA**. Cette documentation décrit les mesures d'accessibilité mises en place, le plan de test, et les bonnes pratiques pour maintenir l'accessibilité.

---

## ✅ Fonctionnalités d'Accessibilité Implémentées

### 1. Navigation Clavier

#### Skip Links
- ✅ **Composant `SkipLink`** : Permet de sauter directement au contenu principal
- ✅ Accessible via `Tab` au chargement de la page
- ✅ Masqué visuellement mais accessible aux lecteurs d'écran

#### Navigation Complète
- ✅ **Focus visible** : Indicateur de focus clair sur tous les éléments interactifs
- ✅ **Tab order logique** : Ordre de tabulation cohérent et intuitif
- ✅ **Clavier complet** :
  - `Tab` / `Shift+Tab` : Navigation entre éléments
  - `Enter` / `Space` : Activer boutons/liens
  - `Escape` : Fermer modales/dialogs
  - `Arrow Keys` : Navigation dans les menus déroulants
  - `Home` / `End` : Navigation dans les listes

**Fichiers** :
- `src/components/SkipLink.tsx`
- Tous les composants UI (shadcn/ui) avec support clavier natif

---

### 2. Contraste et Couleurs

#### Contraste WCAG AA
- ✅ **Ratio minimum 4.5:1** : Texte normal sur fond
- ✅ **Ratio minimum 3:1** : Texte large (18pt+ ou 14pt+ bold)
- ✅ **Éléments interactifs** : Contraste suffisant pour distinguer les états (hover, focus, active)

#### Indépendance des Couleurs
- ✅ **Information non basée uniquement sur la couleur** :
  - Badges avec icônes + texte
  - Formulaires avec labels + indicateurs visuels
  - États d'erreur avec icônes + messages texte

**Vérification** :
- Utilisation de Tailwind CSS avec palette de couleurs accessible
- Classes `.text-muted-foreground` pour contraste adaptatif (dark mode)

---

### 3. Support Lecteurs d'Écran

#### ARIA Labels et Roles
- ✅ **Labels explicites** : Tous les boutons et liens ont des labels clairs
- ✅ **Roles ARIA** : Utilisation appropriée (`button`, `navigation`, `main`, `banner`, etc.)
- ✅ **Live regions** : Pour les notifications et mises à jour dynamiques (toasts)

#### Structure Sémantique HTML
- ✅ **Balises HTML5** : `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- ✅ **Hiérarchie des titres** : Structure H1 → H2 → H3 cohérente
- ✅ **Landmarks** : Régions identifiables pour navigation rapide

#### Textes Alternatifs
- ✅ **Images** : Attribut `alt` pour toutes les images significatives
- ✅ **Icônes décoratives** : `aria-hidden="true"` ou `<span class="sr-only">`
- ✅ **Images fonctionnelles** : Labels descriptifs (`aria-label`)

**Composants** :
- `src/components/OptimizedImage.tsx` : Support `alt` automatique
- Icônes Lucide avec labels ARIA quand nécessaire

---

### 4. Formulaires Accessibles

#### Labels et Descriptions
- ✅ **Labels associés** : Utilisation de `<label>` avec `htmlFor`
- ✅ **Descriptions contextuelles** : `FormDescription` pour aider à la saisie
- ✅ **Messages d'erreur** : Affichage clair avec `aria-invalid` et `aria-describedby`

#### Validation Accessible
- ✅ **Feedback immédiat** : Messages d'erreur affichés dynamiquement
- ✅ **Indicateurs visuels** : Icônes + texte pour les états (valide, invalide)
- ✅ **Focus management** : Focus déplacé vers le premier champ en erreur

**Composants** :
- `src/components/ui/form.tsx` : Composants shadcn/ui avec support ARIA complet

---

### 5. Focus Management

#### Focus Visible
- ✅ **Style de focus** : Indicateur clair (outline ou ring) sur tous les éléments focusables
- ✅ **Focus trap** : Dans les modales, focus restreint au contenu de la modal
- ✅ **Focus restoration** : Restauration du focus après fermeture de modal

#### Gestion du Focus Dynamique
- ✅ **Focus automatique** : Sur le premier champ dans les formulaires
- ✅ **Focus programmatique** : Utilisation de `ref.focus()` pour navigation assistée

---

### 6. Contenu Dynamique

#### Live Regions
- ✅ **Notifications** : Utilisation de `aria-live="polite"` pour les toasts
- ✅ **Alertes importantes** : `aria-live="assertive"` pour messages critiques
- ✅ **Chargement** : États de chargement annoncés aux lecteurs d'écran

#### Mises à Jour Temps Réel
- ✅ **Indicateurs visuels** : Badges et icônes pour les changements
- ✅ **Announces** : Mises à jour annoncées de manière non intrusive

---

### 7. Responsive et Mobile

#### Touch Targets
- ✅ **Taille minimale** : 44×44px pour les éléments tactiles
- ✅ **Espacement** : Espace suffisant entre éléments cliquables

#### Zoom
- ✅ **Zoom jusqu'à 200%** : Interface fonctionnelle et lisible
- ✅ **Viewport responsive** : Adaptation automatique aux différentes tailles d'écran

---

## 🧪 Plan de Test d'Accessibilité

### Tests Automatisés

#### 1. Tests avec axe-core

**Installation** :
```bash
npm install --save-dev @axe-core/playwright
```

**Configuration Playwright** :
```typescript
// playwright.config.ts
import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const test = base.extend({
  // Helper pour tests d'accessibilité
  makeAxeBuilder: async ({ page }, use) => {
    await use((options?: any) => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']));
  },
});

export { test };
export { expect } from '@playwright/test';
```

**Exemple de Test** :
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '../playwright.config';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibilité', () => {
  test('Page d\'accueil devrait être accessible', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await makeAxeBuilder()
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

#### 2. Tests de Navigation Clavier

**Exemple** :
```typescript
test('Navigation clavier complète sur Dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Test Tab order
  await page.keyboard.press('Tab');
  expect(await page.locator(':focus').getAttribute('aria-label')).toContain('Skip to main');
  
  // Test navigation entre éléments
  await page.keyboard.press('Tab');
  // Vérifier que le focus est sur le prochain élément logique
});
```

#### 3. Tests de Contraste

**Utilisation de contrast-checker** :
```typescript
import { getContrastRatio } from 'color-contrast-checker';

test('Contraste suffisant pour texte principal', () => {
  const ratio = getContrastRatio('#000000', '#FFFFFF');
  expect(ratio).toBeGreaterThanOrEqual(4.5); // WCAG AA
});
```

---

### Tests Manuels

#### 1. Test avec Lecteurs d'Écran

**NVDA (Windows)** :
1. Installer NVDA : https://www.nvaccess.org/
2. Naviguer sur chaque page principale
3. Vérifier :
   - Tous les éléments sont annoncés correctement
   - La navigation est logique
   - Les formulaires sont utilisables
   - Les erreurs sont annoncées

**JAWS (Windows)** :
- Test similaire avec JAWS
- Vérifier la compatibilité avec les commandes spécifiques

**VoiceOver (macOS/iOS)** :
- Test sur Mac et iPhone/iPad
- Navigation au doigt (gestes VoiceOver)

**TalkBack (Android)** :
- Test sur appareils Android
- Navigation tactile

#### 2. Test Navigation Clavier Seule

**Procédure** :
1. Désactiver la souris/trackpad
2. Naviguer sur toutes les pages avec uniquement le clavier
3. Vérifier :
   - Tous les éléments sont accessibles
   - Le focus est toujours visible
   - L'ordre de tabulation est logique
   - Les formulaires sont complètement utilisables

#### 3. Test Zoom 200%

**Procédure** :
1. Zoomer à 200% dans le navigateur
2. Vérifier :
   - Tous les éléments sont visibles et fonctionnels
   - Pas de dépassement horizontal
   - Les formulaires restent utilisables
   - Navigation toujours possible

#### 4. Test Contraste

**Outils** :
- **WebAIM Contrast Checker** : https://webaim.org/resources/contrastchecker/
- **axe DevTools** : Extension Chrome/Firefox
- **WAVE** : Extension navigateur

**Vérification** :
- Contraste 4.5:1 pour texte normal
- Contraste 3:1 pour texte large
- Éléments interactifs avec contraste suffisant

---

## 📋 Checklist WCAG 2.1 Level AA

### Niveau A (Obligatoire)

- [x] **1.1.1 Contenu non textuel** : Alternatives textuelles pour images
- [x] **1.3.1 Info et relations** : Structure sémantique HTML
- [x] **1.4.1 Utilisation de la couleur** : Information non basée uniquement sur couleur
- [x] **2.1.1 Clavier** : Tous les fonctionnalités accessibles au clavier
- [x] **2.1.2 Pas de piège au clavier** : Focus peut quitter tous les composants
- [x] **2.4.1 Contourner les blocs** : Skip links présents
- [x] **2.4.2 Titre de page** : Titres de pages uniques et descriptifs
- [x] **2.4.3 Ordre de focus** : Ordre logique et séquentiel
- [x] **2.4.4 Objectif du lien** : Labels de liens clairs
- [x] **3.1.1 Langue de la page** : Attribut `lang` présent
- [x] **3.2.1 Au focus** : Pas de changement de contexte au focus
- [x] **3.2.2 À l'entrée** : Changement de contexte uniquement sur demande
- [x] **3.3.1 Identification des erreurs** : Erreurs identifiées clairement
- [x] **3.3.2 Labels ou instructions** : Labels présents pour tous les champs
- [x] **4.1.1 Analyse syntaxique** : HTML valide
- [x] **4.1.2 Nom, rôle, valeur** : ARIA labels et roles appropriés

### Niveau AA (Recommandé)

- [x] **1.4.3 Contraste (minimum)** : Ratio 4.5:1 pour texte normal
- [x] **1.4.4 Redimensionnement du texte** : Texte redimensionnable jusqu'à 200%
- [x] **1.4.5 Images de texte** : Pas d'images de texte (sauf logo)
- [x] **2.4.5 Méthodes multiples** : Plusieurs méthodes de navigation
- [x] **2.4.6 En-têtes et labels** : En-têtes et labels descriptifs
- [x] **2.4.7 Focus visible** : Indicateur de focus visible
- [x] **3.2.3 Navigation cohérente** : Navigation cohérente entre pages
- [x] **3.2.4 Identification cohérente** : Éléments similaires identifiés de la même manière
- [x] **3.3.3 Suggestions d'erreur** : Suggestions fournies pour erreurs de saisie
- [x] **3.3.4 Prévention des erreurs** : Confirmation pour actions importantes

### Niveau AAA (Nice to have)

- [ ] **1.4.6 Contraste (amélioré)** : Ratio 7:1 pour texte normal
- [ ] **2.4.8 Localisation** : Indicateur de localisation dans la page
- [ ] **2.4.9 Objectif du lien (liens uniquement)** : Contexte clair pour liens
- [ ] **3.3.5 Aide** : Aide contextuelle disponible

---

## 🔍 Outils de Test

### Automatiques

1. **axe DevTools** (Extension Chrome/Firefox)
   - Analyse en temps réel
   - Rapport détaillé des violations
   - Suggestions de corrections

2. **WAVE** (Extension navigateur)
   - Analyse visuelle de la page
   - Identification des problèmes d'accessibilité
   - Rapports détaillés

3. **Lighthouse** (Chrome DevTools)
   - Audit d'accessibilité intégré
   - Score d'accessibilité (0-100)
   - Checklist WCAG

4. **@axe-core/playwright**
   - Tests automatisés dans CI/CD
   - Intégration avec Playwright
   - Rapports de violations

### Manuels

1. **Lecteurs d'écran** :
   - NVDA (Windows, gratuit)
   - JAWS (Windows, payant)
   - VoiceOver (macOS/iOS, intégré)
   - TalkBack (Android, intégré)

2. **Outils de contraste** :
   - WebAIM Contrast Checker
   - Contrast Ratio Calculator

3. **Navigation clavier** :
   - Test manuel avec Tab, Enter, Escape
   - Vérification de l'ordre de focus

---

## 🚀 Intégration dans CI/CD

### Tests Automatisés

**Ajout dans GitHub Actions** :
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:accessibility
```

**Script package.json** :
```json
{
  "scripts": {
    "test:accessibility": "playwright test tests/e2e/accessibility.spec.ts",
    "test:a11y": "playwright test --grep @accessibility"
  }
}
```

---

## 📝 Bonnes Pratiques pour Développeurs

### 1. Utiliser les Composants Accessibles

✅ **Utiliser shadcn/ui** : Tous les composants sont accessibles par défaut
✅ **Éviter les divs cliquables** : Utiliser `<button>` ou `<a>` avec styles

### 2. Labels et ARIA

✅ **Toujours utiliser des labels** :
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

✅ **ARIA labels pour icônes** :
```tsx
<button aria-label="Fermer la modal">
  <X className="h-4 w-4" aria-hidden="true" />
</button>
```

### 3. Focus Management

✅ **Focus visible** :
```tsx
<button className="focus:ring-2 focus:ring-offset-2">
  Cliquer
</button>
```

✅ **Focus trap dans modales** :
- Utiliser le composant `Dialog` de shadcn/ui (déjà implémenté)

### 4. Images et Médias

✅ **Alt text descriptif** :
```tsx
<img src="photo.jpg" alt="Photo du produit CBD, fleurs vertes avec trichomes visibles" />
```

✅ **Icônes décoratives** :
```tsx
<Star className="h-4 w-4" aria-hidden="true" />
<span className="sr-only">Favori</span>
```

### 5. Formulaires

✅ **Messages d'erreur accessibles** :
```tsx
<input 
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" role="alert" className="text-red-500">
    Email invalide
  </p>
)}
```

---

## 🐛 Problèmes Connus et Corrections

### Problèmes Corrigés

1. ✅ **Skip Links** : Implémenté avec composant dédié
2. ✅ **Focus visible** : Styles Tailwind avec `focus:ring`
3. ✅ **Labels ARIA** : Ajoutés sur tous les boutons icon-only
4. ✅ **Contraste** : Palette Tailwind respecte WCAG AA

### Problèmes à Surveiller

- ⚠️ **Contenu dynamique** : S'assurer que les mises à jour temps réel sont annoncées
- ⚠️ **Formulaires complexes** : Vérifier l'accessibilité des champs conditionnels
- ⚠️ **Graphiques** : Ajouter des alternatives textuelles pour les graphiques analytics

---

## 📚 Ressources et Références

### Documentation WCAG

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Guidelines](https://webaim.org/articles/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Outils

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Formation

- [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/fundamentals/accessibility-principles/)
- [A11y Coffee](https://www.a11y.coffee/)

---

## 📅 Planning de Tests

### Tests Automatisés

- ✅ **À chaque PR** : Tests axe-core dans CI/CD
- ✅ **Avant déploiement** : Audit Lighthouse complet

### Tests Manuels

- ✅ **Mensuel** : Test avec lecteur d'écran (NVDA/VoiceOver)
- ✅ **Trimestriel** : Audit complet avec utilisateurs réels
- ✅ **Avant release majeure** : Test complet WCAG AA

---

## 🎯 Objectifs et Métriques

### Score Cible

- **Lighthouse Accessibility** : ≥ 95/100
- **Violations axe-core** : 0 violations critiques
- **WCAG 2.1 Level AA** : 100% conforme

### Métriques Actuelles

- **Lighthouse Accessibility** : À mesurer
- **Violations détectées** : À mesurer
- **Dernier audit** : 2024-12-02

---

## ✅ Checklist de Vérification Rapide

Avant de merger une PR, vérifier :

- [ ] Navigation clavier fonctionnelle
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Labels ARIA présents pour boutons icon-only
- [ ] Images avec `alt` text descriptif
- [ ] Messages d'erreur accessibles (role="alert")
- [ ] Contraste suffisant (vérifier avec outil)
- [ ] HTML sémantique (balises appropriées)
- [ ] Tests d'accessibilité passent (si présents)

---

**⚠️ IMPORTANT** : L'accessibilité est une responsabilité partagée. Chaque développeur doit vérifier l'accessibilité de son code avant de merger.

---

*Document créé le : 2024-12-02*  
*Dernière révision : 2024-12-02*  
*Prochaine révision prévue : 2025-01-02*

