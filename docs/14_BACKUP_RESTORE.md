# 📦 Documentation Backups & Restore - CBD Flower Cup

**Date de création** : 2024-12-02  
**Dernière mise à jour** : 2024-12-02  
**Statut** : Documentation complète

---

## 🎯 Vue d'Ensemble

Cette documentation détaille les procédures de sauvegarde et de restauration pour la plateforme CBD Flower Cup. La continuité de service est critique, notamment pour les concours officiels où la perte de données pourrait compromettre l'intégrité des résultats.

---

## 📊 Objectifs de Continuité de Service

### RTO (Recovery Time Objective)
**Temps cible : 4 heures**

Objectif : Restaurer la plateforme complètement fonctionnelle dans les **4 heures** suivant un incident majeur.

### RPO (Recovery Point Objective)
**Point de récupération cible : 24 heures**

Objectif : Limiter la perte de données à un maximum de **24 heures** de données (sauvegarde quotidienne).

---

## 🔄 Stratégie de Sauvegarde

### Sauvegardes Automatiques Supabase

Supabase propose des sauvegardes automatiques selon le plan :

#### Plan Free
- ❌ Pas de sauvegarde automatique
- ⚠️ **Recommandation** : Migration vers plan Pro minimum

#### Plan Pro
- ✅ Sauvegardes automatiques quotidiennes
- ✅ Rétention : 7 jours
- ✅ Point-in-time recovery (PITR) : disponible

#### Plan Team/Enterprise
- ✅ Sauvegardes automatiques quotidiennes
- ✅ Rétention : 30 jours (configurable jusqu'à 90 jours)
- ✅ Point-in-time recovery (PITR) : disponible
- ✅ Sauvegardes géographiquement distribuées

### Configuration Recommandée

**Pour un environnement de production** :

1. **Plan Supabase** : Team ou Enterprise minimum
2. **Fréquence** : Quotidienne (automatique)
3. **Rétention** : 30 jours minimum (90 jours recommandé pour concours critiques)
4. **Point-in-time recovery** : Activé
5. **Région de sauvegarde** : Même région que l'instance principale (ou région de secours)

---

## 💾 Procédures de Sauvegarde

### 1. Sauvegardes Automatiques Supabase

Les sauvegardes automatiques sont gérées par Supabase. Aucune action manuelle n'est requise.

**Vérification de l'état des sauvegardes** :

1. Accéder au Dashboard Supabase : https://app.supabase.com
2. Sélectionner le projet : `hsrtfgpjmchsgunpynbg`
3. Aller dans **Settings** → **Database** → **Backups**
4. Vérifier la liste des sauvegardes disponibles

**Informations affichées** :
- Date et heure de la sauvegarde
- Taille de la sauvegarde
- Statut (succès/échec)
- Option de téléchargement (si disponible)

### 2. Sauvegardes Manuelles (Via Dashboard)

En cas de besoin spécifique (avant migration majeure, avant modification importante, etc.) :

1. Accéder au Dashboard Supabase
2. **Settings** → **Database** → **Backups**
3. Cliquer sur **"Create Backup"** ou **"Backup Now"**
4. Attendre la confirmation de création
5. Noter la référence de la sauvegarde

### 3. Sauvegardes via CLI Supabase

#### Installation du CLI

```bash
npm install -g supabase
```

#### Configuration

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref hsrtfgpjmchsgunpynbg
```

#### Créer une sauvegarde manuelle

```bash
# Créer une sauvegarde de la base de données
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Avec compression
supabase db dump | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### Sauvegardes avec pg_dump (Alternative)

```bash
# Télécharger la connection string depuis Supabase Dashboard
# Settings → Database → Connection string → URI

# Sauvegarde complète
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" > backup_full.sql

# Sauvegarde uniquement le schéma
pg_dump --schema-only "postgresql://..." > backup_schema.sql

# Sauvegarde uniquement les données
pg_dump --data-only "postgresql://..." > backup_data.sql
```

### 4. Sauvegardes du Storage (Fichiers)

#### Photos des Entrées

**Bucket** : `entry-photos`  
**Type** : Public

**Procédure** :
1. Accéder à Supabase Dashboard
2. **Storage** → `entry-photos`
3. **Actions** → **Download all** (ou sélectionner les fichiers)
4. Sauvegarder dans un stockage externe (S3, Google Cloud Storage, etc.)

#### Documents COA

**Bucket** : `entry-documents`  
**Type** : Privé

**Procédure** :
```bash
# Via Supabase CLI
supabase storage download entry-documents --bucket entry-documents --output ./backups/storage/

# Ou via l'API Supabase Storage (script personnalisé requis)
```

**⚠️ Important** : Les fichiers du Storage doivent être sauvegardés séparément, les backups DB ne contiennent que les métadonnées (URLs).

---

## 🔧 Procédures de Restauration

### 1. Restauration depuis le Dashboard Supabase

#### Point-in-Time Recovery (PITR)

1. Accéder au Dashboard Supabase
2. **Settings** → **Database** → **Backups**
3. Sélectionner la sauvegarde ou le point dans le temps
4. Cliquer sur **"Restore"** ou **"Create Database from Backup"**
5. Choisir :
   - Restaurer sur la même instance (⚠️ remplace les données existantes)
   - Créer une nouvelle instance de test
6. Confirmer la restauration
7. ⚠️ **ATTENTION** : La restauration remplace TOUTES les données actuelles

#### Restauration Partielle

Supabase ne permet pas de restauration partielle via le Dashboard. Utiliser pg_restore pour une restauration ciblée.

### 2. Restauration via CLI Supabase

#### Restauration complète

```bash
# Restaurer depuis un fichier SQL
supabase db reset --file backup_20241202_120000.sql

# Ou via pipe
cat backup.sql | supabase db reset
```

#### Restauration avec pg_restore

```bash
# Depuis un dump personnalisé
pg_restore -d "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" backup.dump

# Restaurer uniquement le schéma
pg_restore --schema-only -d "postgresql://..." backup.dump

# Restaurer uniquement les données (après restauration du schéma)
pg_restore --data-only -d "postgresql://..." backup.dump
```

### 3. Restauration Incrémentale (Tables Spécifiques)

Pour restaurer uniquement certaines tables :

```bash
# Créer un dump d'une table spécifique
pg_dump --table=entries "postgresql://..." > entries_backup.sql

# Restaurer la table
psql "postgresql://..." < entries_backup.sql

# ⚠️ Attention aux dépendances (clés étrangères, contraintes)
```

### 4. Restauration du Storage

```bash
# Restaurer depuis un backup local
supabase storage upload entry-photos --bucket entry-photos --local ./backups/storage/entry-photos/

# Ou fichier par fichier via l'interface Supabase Dashboard
```

---

## 📋 Plan de Test de Restauration

### Tests Mensuels Recommandés

**Objectif** : Vérifier que les procédures de restauration fonctionnent correctement.

#### Procédure de Test

1. **Créer un environnement de test** :
   - Créer un nouveau projet Supabase (gratuit) pour les tests
   - Ou utiliser une instance locale avec Supabase CLI

2. **Effectuer une sauvegarde** :
   ```bash
   supabase db dump -f test_backup_$(date +%Y%m%d).sql
   ```

3. **Modifier/Supprimer des données de test** :
   - Créer des données de test
   - Noter les modifications

4. **Restaurer la sauvegarde** :
   ```bash
   supabase db reset --file test_backup_YYYYMMDD.sql
   ```

5. **Vérifier** :
   - Les données restaurées correspondent à l'état avant modification
   - Les relations (foreign keys) sont intactes
   - Les triggers et fonctions sont opérationnels
   - Les politiques RLS fonctionnent correctement

6. **Documenter le résultat** :
   - Date du test
   - Durée de la restauration
   - Problèmes rencontrés (le cas échéant)
   - Actions correctives

#### Fréquence des Tests

- ✅ **Mensuel** : Test complet de restauration
- ✅ **Trimestriel** : Test de restauration avec données réelles (anonymisées)
- ✅ **Avant migration majeure** : Test obligatoire

---

## 🗄️ Sauvegardes Additionnelles

### 1. Sauvegardes Locales (Recommandé)

En plus des sauvegardes Supabase, maintenir des sauvegardes locales ou sur un service externe :

#### Script de Sauvegarde Automatisé

```bash
#!/bin/bash
# backup.sh - Script de sauvegarde automatique

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# Sauvegarde DB
echo "Création de la sauvegarde DB..."
supabase db dump -f "$BACKUP_DIR/db_backup_$DATE.sql"

# Compression
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Nettoyer les anciennes sauvegardes (>30 jours)
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Sauvegarde terminée : db_backup_$DATE.sql.gz"
```

#### Configuration Cron (Linux/Mac)

```bash
# Ajouter au crontab (crontab -e)
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /path/to/backup.sh >> /path/to/backup.log 2>&1
```

#### Configuration Task Scheduler (Windows)

1. Ouvrir **Planificateur de tâches**
2. Créer une tâche de base
3. Déclencher : Quotidiennement à 2h00
4. Action : Exécuter le script PowerShell

```powershell
# backup.ps1
$BackupDir = ".\backups"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -ItemType Directory -Force -Path $BackupDir

# Sauvegarde DB (nécessite Supabase CLI)
supabase db dump -f "$BackupDir\db_backup_$Date.sql"

# Compression
Compress-Archive -Path "$BackupDir\db_backup_$Date.sql" -DestinationPath "$BackupDir\db_backup_$Date.zip"

# Nettoyer anciennes sauvegardes (>30 jours)
Get-ChildItem -Path $BackupDir -Filter "db_backup_*.zip" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

### 2. Sauvegardes Cloud (AWS S3, Google Cloud Storage, Azure)

#### AWS S3 (Exemple)

```bash
# Installer AWS CLI
# aws configure (configurer les credentials)

# Upload vers S3
aws s3 cp ./backups/db_backup_20241202.sql.gz s3://bud-cup-backups/database/

# Avec lifecycle policy pour expiration automatique
# Configurer dans AWS Console : S3 → Bucket → Lifecycle rules
```

#### Script Intégré

```bash
#!/bin/bash
# backup_to_s3.sh

BACKUP_FILE="db_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
BUCKET="s3://bud-cup-backups/database/"

# Créer la sauvegarde
supabase db dump | gzip > "$BACKUP_FILE"

# Upload vers S3
aws s3 cp "$BACKUP_FILE" "$BUCKET"

# Supprimer le fichier local
rm "$BACKUP_FILE"
```

### 3. Sauvegardes des Migrations SQL

**⚠️ CRITIQUE** : Toutes les migrations SQL sont versionnées dans `supabase/migrations/`.

**Procédure** :
1. Les migrations sont dans Git (déjà sauvegardées)
2. En cas de perte de DB, réappliquer toutes les migrations :
   ```bash
   supabase db reset  # Crée une DB vierge
   supabase db push   # Applique toutes les migrations
   ```

---

## 📊 Monitoring des Sauvegardes

### Vérifications Quotidiennes Recommandées

1. **Dashboard Supabase** :
   - Vérifier que la dernière sauvegarde a réussi
   - Vérifier la taille (détecter anomalies)

2. **Alertes Automatiques** :
   - Configurer des notifications Supabase pour échecs de sauvegarde
   - Monitoring via Sentry ou service équivalent

### Script de Vérification

```bash
#!/bin/bash
# check_backup_status.sh

# Vérifier via Supabase API (nécessite API key)
# Ou via dashboard web scraping (non recommandé)

# Alternative : Vérifier la présence d'un fichier de backup local
if [ -f "./backups/db_backup_$(date +%Y%m%d)*.sql.gz" ]; then
    echo "✅ Sauvegarde du jour trouvée"
else
    echo "❌ ALERTE : Aucune sauvegarde du jour trouvée"
    # Envoyer notification (email, Slack, etc.)
fi
```

---

## 🚨 Plan de Continuité d'Activité (PCA)

### Scénario 1 : Perte Partielle de Données (Table spécifique)

1. **Identification** :
   - Identifier la table affectée
   - Déterminer la période de perte

2. **Restauration** :
   - Restaurer uniquement la table depuis la dernière sauvegarde valide
   - Vérifier l'intégrité référentielle

3. **Réconciliation** :
   - Identifier les données perdues
   - Notifier les utilisateurs concernés si nécessaire
   - Documenter l'incident

### Scénario 2 : Perte Complète de la Base de Données

1. **Arrêt d'urgence** :
   - Mettre l'application en maintenance
   - Notifier les utilisateurs

2. **Restauration** :
   - Restaurer depuis la dernière sauvegarde complète
   - Vérifier l'intégrité complète

3. **Réactivation** :
   - Tests de fonctionnalités critiques
   - Réactivation progressive
   - Monitoring renforcé

### Scénario 3 : Corruption de Données

1. **Isolation** :
   - Identifier les données corrompues
   - Isoler si possible

2. **Restauration sélective** :
   - Restaurer uniquement les données corrompues
   - Vérifier l'intégrité

3. **Correction** :
   - Appliquer des corrections manuelles si nécessaire
   - Documenter les corrections

---

## 📝 Checklist Pré-Restauration

Avant de procéder à une restauration :

- [ ] ✅ Vérifier que la sauvegarde existe et est valide
- [ ] ✅ Noter l'heure de début de la restauration
- [ ] ✅ Mettre l'application en maintenance (si production)
- [ ] ✅ Notifier l'équipe technique
- [ ] ✅ Sauvegarder l'état actuel (même corrompu) pour analyse
- [ ] ✅ Vérifier les credentials de connexion DB
- [ ] ✅ Vérifier l'espace disque disponible
- [ ] ✅ Documenter la raison de la restauration
- [ ] ✅ Prévoir le temps nécessaire (estimé)

---

## 📝 Checklist Post-Restauration

Après une restauration :

- [ ] ✅ Vérifier l'intégrité de la base de données
- [ ] ✅ Vérifier les relations (foreign keys)
- [ ] ✅ Vérifier les politiques RLS
- [ ] ✅ Vérifier les triggers et fonctions
- [ ] ✅ Tester les fonctionnalités critiques
- [ ] ✅ Vérifier la connectivité de l'application
- [ ] ✅ Vérifier les sauvegardes du Storage (photos, COA)
- [ ] ✅ Noter l'heure de fin de restauration
- [ ] ✅ Calculer le temps de restauration (RTO atteint ?)
- [ ] ✅ Documenter les problèmes rencontrés
- [ ] ✅ Réactiver l'application progressivement
- [ ] ✅ Monitoring renforcé pendant 24h

---

## 🔐 Sécurité des Sauvegardes

### Recommandations

1. **Chiffrement** :
   - Les sauvegardes Supabase sont chiffrées automatiquement
   - Pour sauvegardes locales : utiliser chiffrement (GPG, etc.)

2. **Accès** :
   - Limiter l'accès aux sauvegardes aux administrateurs uniquement
   - Utiliser des credentials séparés pour les sauvegardes

3. **Stockage** :
   - Ne jamais stocker de sauvegardes sur des machines accessibles publiquement
   - Utiliser des services cloud sécurisés (S3 avec chiffrement, etc.)

4. **Rétention** :
   - Respecter les politiques de rétention (RGPD, etc.)
   - Supprimer les sauvegardes obsolètes régulièrement

---

## 📞 Contacts d'Urgence

- **Support Supabase** : https://supabase.com/support
- **Documentation Supabase Backups** : https://supabase.com/docs/guides/platform/backups

---

## 📚 Ressources Supplémentaires

- [Documentation Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [Documentation pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Documentation pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)

---

**⚠️ IMPORTANT** : Cette documentation doit être revue et testée régulièrement. Les procédures doivent être mises à jour si l'architecture ou les outils changent.

---

*Document créé le : 2024-12-02*  
*Dernière révision : 2024-12-02*  
*Prochaine révision prévue : 2025-01-02*

