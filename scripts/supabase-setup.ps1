param(
  [string]$ProjectRef = "hsrtfgpjmchsgunpynbg",
  [string]$SeedFile = "supabase/seed.sql",
  [switch]$SkipSeed,
  [switch]$SkipTypes,
  [switch]$SkipSecrets,
  [string]$AccessToken,
  [string]$ServiceRoleKey
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Error "La commande '$Name' est introuvable. Installe-la avant de continuer."
  }
}

function Invoke-Step {
  param(
    [string]$Message,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "▶ $Message" -ForegroundColor Cyan
  & $Action
}

Assert-Command -Name "supabase"

# 1. Lien projet (ouvre le navigateur si nécessaire)
# 1. Lien projet (ouvre le navigateur si nécessaire)
# 0. (Optionnel) Authentification CLI
if ($AccessToken) {
  Invoke-Step -Message "Authentification Supabase CLI" -Action {
    supabase login --token $AccessToken
  }
} else {
  Write-Host ""
  Write-Host "ℹ️ Aucun token fourni. Si le CLI n'est pas déjà authentifié, exécute 'supabase login' manuellement." -ForegroundColor Yellow
}

# 1. Lien projet (ouvre le navigateur si nécessaire)
Invoke-Step -Message "Lien avec le projet Supabase ($ProjectRef)" -Action {
  supabase link --project-ref $ProjectRef
}

# 2. Configurer les secrets pour les Edge Functions
if (-not $SkipSecrets) {
  $supabaseUrl = "https://$ProjectRef.supabase.co"
  
  Invoke-Step -Message "Configuration des secrets Supabase pour les Edge Functions" -Action {
    Write-Host "  Configuration de SUPABASE_URL..." -ForegroundColor Gray
    supabase secrets set SUPABASE_URL=$supabaseUrl --project-ref $ProjectRef
    
    if ($ServiceRoleKey) {
      Write-Host "  Configuration de SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Gray
      supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$ServiceRoleKey --project-ref $ProjectRef
      Write-Host "  ✅ Secrets configurés." -ForegroundColor Green
    } else {
      Write-Host "  ⚠️  SUPABASE_SERVICE_ROLE_KEY non fournie. Configure-la manuellement avec :" -ForegroundColor Yellow
      Write-Host "     supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<votre-key> --project-ref $ProjectRef" -ForegroundColor Yellow
      Write-Host "     (Trouve la clé dans Supabase Dashboard → Settings → API → service_role key)" -ForegroundColor Yellow
    }
  }
}

# 3. Appliquer migrations
Invoke-Step -Message "Application des migrations SQL" -Action {
  supabase db push
}

# 4. Seed facultatif
if (-not $SkipSeed) {
  if (-not (Test-Path $SeedFile)) {
    Write-Error "Seed file introuvable: $SeedFile (utilise --SeedFile pour ajuster ou --SkipSeed)."
  }

  Invoke-Step -Message "Injection des données d'exemple ($SeedFile)" -Action {
    supabase db remote commit --file $SeedFile
  }
}

# 5. Génération des types TypeScript
if (-not $SkipTypes) {
  $typesOutput = "src/integrations/supabase/types.ts"
  Invoke-Step -Message "Génération des types TypeScript -> $typesOutput" -Action {
    supabase gen types typescript --project-id $ProjectRef --schema public > $typesOutput
  }
}

Write-Host ""
Write-Host "✅ Setup Supabase terminé." -ForegroundColor Green
Write-Host "Prochaines étapes : npm run dev / npm run build."

