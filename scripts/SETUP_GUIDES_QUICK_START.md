# Configuration Rapide des Guides - Quick Start

## ✅ Étape 1 : Créer la table (OBLIGATOIRE)

Exécutez ce script dans **Supabase SQL Editor** :

📁 **Fichier** : `scripts/create_guides_table_fixed.sql`

Ce script crée :
- ✅ Le bucket Storage `guides`
- ✅ La table `guides` avec toutes les contraintes
- ✅ Les politiques RLS pour la table
- ❌ Pas de politiques Storage (à créer via Dashboard)

**Vérification** : Si vous voyez "Table guides créée avec succès", c'est bon ! ✅

---

## ⚠️ Étape 2 : Créer les politiques Storage (NÉCESSAIRE pour l'upload)

**Vous avez probablement eu une erreur** : `42501: must be owner of table objects`

C'est **NORMAL** - les politiques Storage ne peuvent pas être créées via SQL sans permissions spéciales.

### ✅ Solution : Utiliser le Dashboard Supabase

📖 **Voir le guide détaillé** : `SETUP_STORAGE_POLICIES_DASHBOARD.md`

**En résumé** :
1. Allez dans **Supabase Dashboard > Storage > guides > Policies**
2. Créez 3 politiques (INSERT, UPDATE, DELETE) pour les organisateurs
3. **Ne créez PAS** de politique SELECT (on utilise des signed URLs)

**Temps estimé** : 5 minutes

---

## 🎯 Étape 3 : Tester

1. Connectez-vous en tant qu'**organisateur**
2. Allez dans **Dashboard > Gérer les guides**
3. Essayez d'uploader un guide PDF

Si ça fonctionne, c'est terminé ! 🎉

---

## 📚 Documentation complète

- **Guide détaillé** : `scripts/README_GUIDES_SETUP.md`
- **Guide Dashboard** : `scripts/SETUP_STORAGE_POLICIES_DASHBOARD.md`

---

## ❓ Questions fréquentes

**Q : Dois-je exécuter les scripts SQL pour les politiques Storage ?**  
R : ❌ Non, ils échoueront. Utilisez le Dashboard.

**Q : Pourquoi pas de politique SELECT ?**  
R : On utilise des signed URLs (plus sécurisé) générées automatiquement par l'application.

**Q : Comment tester si tout fonctionne ?**  
R : Essayez d'uploader un guide PDF en tant qu'organisateur.

