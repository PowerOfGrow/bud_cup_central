param(
  [string]$ProjectRef = "hsrtfgpjmchsgunpynbg",
  [string]$SeedFile = "supabase/seed.sql",
  [switch]$SkipSeed,
  [switch]$SkipTypes,
  [string]$AccessToken
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

# 2. Appliquer migrations
Invoke-Step -Message "Application des migrations SQL" -Action {
  supabase db push
}

# 3. Seed facultatif
if (-not $SkipSeed) {
  if (-not (Test-Path $SeedFile)) {
    Write-Error "Seed file introuvable: $SeedFile (utilise --SeedFile pour ajuster ou --SkipSeed)."
  }

  Invoke-Step -Message "Injection des données d'exemple ($SeedFile)" -Action {
    supabase db remote commit --file $SeedFile
  }
}

# 4. Génération des types TypeScript
if (-not $SkipTypes) {
  $typesOutput = "src/integrations/supabase/types.ts"
  Invoke-Step -Message "Génération des types TypeScript -> $typesOutput" -Action {
    supabase gen types typescript --project-id $ProjectRef --schema public > $typesOutput
  }
}

Write-Host ""
Write-Host "✅ Setup Supabase terminé." -ForegroundColor Green
Write-Host "Prochaines étapes : npm run dev / npm run build."

