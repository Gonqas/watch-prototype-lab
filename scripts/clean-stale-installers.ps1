param(
    [string]$Version
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$releaseDir = (Resolve-Path (Join-Path $repoRoot 'release')).Path
$bundleDir = (Resolve-Path (Join-Path $repoRoot 'src-tauri\target\release\bundle\nsis')).Path

if (-not $Version) {
    $package = Get-Content -Raw (Join-Path $repoRoot 'package.json') | ConvertFrom-Json
    $Version = [string]$package.version
}
if ($Version -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
    throw "Version no valida: $Version"
}

$currentInstallerName = "WatchPrototypeLab-Instalador-Windows-x64-v$Version.exe"
$currentBundleName = "Watch Prototype Lab_${Version}_x64-setup.exe"
$currentReleaseNames = @(
    $currentInstallerName,
    "$currentInstallerName.sha256.txt",
    "release-manifest-v$Version.json",
    'release-manifest.json',
    "LEEME-INSTALACION-v$Version.txt",
    'LEEME-INSTALACION.txt'
)

foreach ($requiredName in @($currentInstallerName, "$currentInstallerName.sha256.txt", "release-manifest-v$Version.json")) {
    if (-not (Test-Path -LiteralPath (Join-Path $releaseDir $requiredName) -PathType Leaf)) {
        throw "No se limpia porque falta el artefacto vigente: $requiredName"
    }
}
if (-not (Test-Path -LiteralPath (Join-Path $bundleDir $currentBundleName) -PathType Leaf)) {
    throw "No se limpia porque falta el bundle vigente: $currentBundleName"
}

$releasePatterns = @(
    'WatchPrototypeLab-Instalador-Windows-x64-v*.exe',
    'WatchPrototypeLab-Instalador-Windows-x64-v*.exe.sha256.txt',
    'release-manifest-v*.json',
    'LEEME-INSTALACION-v*.txt'
)
$staleRelease = foreach ($pattern in $releasePatterns) {
    Get-ChildItem -LiteralPath $releaseDir -File -Filter $pattern |
        Where-Object { $_.Name -notin $currentReleaseNames }
}
$staleRelease = @($staleRelease | Sort-Object FullName -Unique)
$staleBundles = @(Get-ChildItem -LiteralPath $bundleDir -File -Filter '*_x64-setup.exe' |
    Where-Object { $_.Name -ne $currentBundleName })
$staleItems = @($staleRelease + $staleBundles)

foreach ($item in $staleItems) {
    $insideRelease = $item.FullName.StartsWith(
        $releaseDir + [IO.Path]::DirectorySeparatorChar,
        [StringComparison]::OrdinalIgnoreCase
    )
    $insideBundle = $item.FullName.StartsWith(
        $bundleDir + [IO.Path]::DirectorySeparatorChar,
        [StringComparison]::OrdinalIgnoreCase
    )
    if (-not ($insideRelease -or $insideBundle)) {
        throw "Destino fuera del alcance permitido: $($item.FullName)"
    }
    if ($item.Name -in $currentReleaseNames -or $item.Name -eq $currentBundleName) {
        throw "Se intento eliminar un artefacto vigente: $($item.FullName)"
    }
}

foreach ($item in $staleItems) {
    Remove-Item -LiteralPath $item.FullName -Force
}

Write-Host "Eliminados $($staleItems.Count) artefactos antiguos." -ForegroundColor Green
Write-Host "Conservado: $(Join-Path $releaseDir $currentInstallerName)"
Write-Host "Conservado: $(Join-Path $bundleDir $currentBundleName)"
