# Script de renommage des fichiers docs dans l'ordre d'implémentation
# Usage: .\scripts\rename-docs-files.ps1

$docsPath = "docs"
$renames = @{
    "README.md" = "01_README.md"
    "OVERVIEW.md" = "02_OVERVIEW.md"
    "DEVELOPER_GUIDE.md" = "03_DEVELOPER_GUIDE.md"
    "USER_GUIDE.md" = "04_USER_GUIDE.md"
    "API.md" = "05_API.md"
    # "06_ANALYTICS.md" déjà renommé
    "SECURITY.md" = "07_SECURITY.md"
    "PERFORMANCE.md" = "08_PERFORMANCE.md"
    "TESTING.md" = "09_TESTING.md"
    "EMAIL_NOTIFICATIONS.md" = "10_EMAIL_NOTIFICATIONS.md"
    # "11_CONFIG.md" déjà renommé
    "MONITORING.md" = "12_MONITORING.md"
    "ACCESSIBILITY.md" = "13_ACCESSIBILITY.md"
    "BACKUP_RESTORE.md" = "14_BACKUP_RESTORE.md"
    "IMPROVEMENTS_ROADMAP.md" = "15_IMPROVEMENTS_ROADMAP.md"
    "SCREENSHOTS_GUIDE.md" = "16_SCREENSHOTS_GUIDE.md"
    "SUPABASE_REDIRECT_URLS.md" = "17_SUPABASE_REDIRECT_URLS.md"
    "CI_CD.md" = "18_CI_CD.md"
    "E2E_TESTING.md" = "19_E2E_TESTING.md"
    "COMPLETE_IMPLEMENTATION_STATUS.md" = "20_COMPLETE_IMPLEMENTATION_STATUS.md"
    "TASKS_REMAINING.md" = "21_TASKS_REMAINING.md"
}

Write-Host "Renommage des fichiers dans $docsPath..." -ForegroundColor Cyan

foreach ($oldName in $renames.Keys) {
    $oldPath = Join-Path $docsPath $oldName
    $newPath = Join-Path $docsPath $renames[$oldName]
    
    if (Test-Path $oldPath) {
        if (Test-Path $newPath) {
            Write-Host "⚠️  $newPath existe déjà, ignoré" -ForegroundColor Yellow
        } else {
            Rename-Item -Path $oldPath -NewName $renames[$oldName]
            Write-Host "✅ $oldName → $($renames[$oldName])" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  $oldName n'existe pas" -ForegroundColor Yellow
    }
}

Write-Host "`nRenommage terminé !" -ForegroundColor Green

