param(
    [switch]$SkipVerification
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$packageJsonPath = Join-Path $repoRoot 'package.json'
$tauriConfigPath = Join-Path $repoRoot 'src-tauri\tauri.conf.json'
$cargoTomlPath = Join-Path $repoRoot 'src-tauri\Cargo.toml'
$cadSidecar = Join-Path $repoRoot 'cad-engine\dist\watchlab-cad\watchlab-cad.exe'
$bundleDir = Join-Path $repoRoot 'src-tauri\target\release\bundle\nsis'
$releaseDir = Join-Path $repoRoot 'release'

Push-Location $repoRoot
try {
    $package = Get-Content -Raw $packageJsonPath | ConvertFrom-Json
    $tauriConfig = Get-Content -Raw $tauriConfigPath | ConvertFrom-Json
    $cargoVersionMatch = Select-String -LiteralPath $cargoTomlPath -Pattern '^version = "([^"]+)"' |
        Select-Object -First 1
    if (-not $cargoVersionMatch) { throw 'No se pudo leer la version del paquete Rust.' }
    $cargoVersion = $cargoVersionMatch.Matches[0].Groups[1].Value
    if ($package.version -ne $tauriConfig.version -or $package.version -ne $cargoVersion) {
        throw "Versiones incoherentes: package.json=$($package.version), tauri.conf=$($tauriConfig.version), Cargo.toml=$cargoVersion."
    }

    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'No se encontro npm.cmd. Instala Node.js antes de generar el instalador.'
    }
    if (-not (Get-Command cargo.exe -ErrorAction SilentlyContinue)) {
        throw 'No se encontro cargo.exe. Instala Rust antes de generar el instalador.'
    }

    if (-not (Test-Path (Join-Path $repoRoot 'node_modules'))) {
        Write-Host 'Instalando dependencias de la aplicacion...' -ForegroundColor Cyan
        & npm.cmd install
        if ($LASTEXITCODE -ne 0) { throw 'npm install no termino correctamente.' }
    }

    if (-not (Test-Path $cadSidecar)) {
        if (-not (Test-Path (Join-Path $repoRoot '.venv-cad\Scripts\python.exe'))) {
            throw 'Falta el entorno .venv-cad necesario para empaquetar el motor CAD.'
        }
        Write-Host 'Empaquetando el motor CAD nativo...' -ForegroundColor Cyan
        & npm.cmd run cad:package
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo empaquetar el motor CAD.' }
    }

    if (-not $SkipVerification) {
        Write-Host 'Verificando codigo, pruebas y compilacion web...' -ForegroundColor Cyan
        & npm.cmd run verify
        if ($LASTEXITCODE -ne 0) { throw 'La verificacion previa al instalador ha fallado.' }
    }

    Write-Host 'Generando instalador de Windows (NSIS, espanol/ingles)...' -ForegroundColor Cyan
    & npm.cmd run desktop:build -- --bundles nsis
    if ($LASTEXITCODE -ne 0) { throw 'Tauri no pudo generar el instalador.' }

    $installer = Get-ChildItem -LiteralPath $bundleDir -Filter '*-setup.exe' |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $installer) { throw "No se encontro el instalador generado en $bundleDir." }

    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
    $clearName = "WatchPrototypeLab-Instalador-Windows-x64-v$($package.version).exe"
    $clearPath = Join-Path $releaseDir $clearName
    Copy-Item -LiteralPath $installer.FullName -Destination $clearPath -Force

    $hash = Get-FileHash -LiteralPath $clearPath -Algorithm SHA256
    $hashLine = "$($hash.Hash.ToLowerInvariant())  $clearName"
    Set-Content -LiteralPath "$clearPath.sha256.txt" -Value $hashLine -Encoding ascii

    $installerItem = Get-Item -LiteralPath $clearPath
    $sizeMb = [math]::Round($installerItem.Length / 1MB, 1)
    if ($installerItem.Length -lt 10MB) {
        throw "El instalador generado es anormalmente pequeno: $($installerItem.Length) bytes."
    }
    $stream = [System.IO.File]::OpenRead($clearPath)
    try {
        $first = $stream.ReadByte()
        $second = $stream.ReadByte()
    } finally {
        $stream.Dispose()
    }
    if ($first -ne 0x4D -or $second -ne 0x5A) {
        throw 'El artefacto generado no tiene una cabecera PE valida.'
    }

    $signature = Get-AuthenticodeSignature -LiteralPath $clearPath
    $signatureStatus = [string]$signature.Status
    $signedBy = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null }
    $builtAt = (Get-Date).ToUniversalTime().ToString('o')
    $manifest = [ordered]@{
        format = 'watch-prototype-lab-release'
        formatVersion = 1
        product = $tauriConfig.productName
        version = $package.version
        platform = 'windows'
        architecture = 'x64'
        installer = $clearName
        bytes = $installerItem.Length
        sha256 = $hash.Hash.ToLowerInvariant()
        signatureStatus = $signatureStatus
        signedBy = $signedBy
        installMode = $tauriConfig.bundle.windows.nsis.installMode
        languages = @($tauriConfig.bundle.windows.nsis.languages)
        webviewInstallMode = $tauriConfig.bundle.windows.webviewInstallMode.type
        includesCadSidecar = $true
        academyOffline = $true
        builtAt = $builtAt
        verificationSkipped = [bool]$SkipVerification
    }
    $manifestJson = $manifest | ConvertTo-Json -Depth 6
    $manifestJson | Set-Content -LiteralPath (Join-Path $releaseDir "release-manifest-v$($package.version).json") -Encoding utf8
    $manifestJson | Set-Content -LiteralPath (Join-Path $releaseDir 'release-manifest.json') -Encoding utf8

    $signatureExplanation = if ($signatureStatus -eq 'Valid') {
        "Firma Authenticode valida: $signedBy"
    } else {
        'El instalador no tiene una firma comercial valida. Windows SmartScreen puede mostrar Editor desconocido.'
    }
    $readme = @(
        'WATCH PROTOTYPE LAB - INSTALACION EN WINDOWS'
        '================================================'
        ''
        "Version: $($package.version)"
        'Arquitectura: Windows x64'
        "Archivo: $clearName"
        "Tamano: $sizeMb MB"
        "SHA-256: $($hash.Hash.ToLowerInvariant())"
        ''
        'INSTALAR'
        '1. Conserva juntos el instalador, este archivo y el .sha256.txt.'
        "2. Abre $clearName."
        '3. Se instala para el usuario actual; no necesita permisos de administrador.'
        '4. Abre Watch Prototype Lab desde el menu Inicio.'
        ''
        'QUE INCLUYE'
        '- Estudio de ingenieria relojera.'
        '- Watchmaking Academy con rutas, laboratorios, Atlas, Cuaderno y progreso local.'
        '- Enciclopedia offline: 24 rutas, 222 lecciones, 289 practicas y 509 conceptos.'
        '- Corpus clasico trazable: Theory of Horology, Bulova, Chicago y TM 9-1575.'
        '- 25 laboratorios causales y seguridad historica explicita; los procedimientos peligrosos permanecen bloqueados.'
        '- Teoria de historia, materiales, fisica, cuarzo, servicio, micromecanica, complicaciones y restauracion.'
        '- Registro privado de unidades fisicas, inspeccion fotografica y metrologia trazable.'
        '- Comparaciones nominal-medida, propuestas reversibles y expedientes exportables.'
        '- Fabricacion y acabados: caja, esfera, agujas, puentes, micromecanica y decoracion.'
        '- Ruta de reloj propio: movimiento adquirido, modificacion controlada y movimiento propio.'
        '- Validacion: revision relojera, principiantes, transferencia, accesibilidad y retencion.'
        '- Motor CAD nativo.'
        '- Datos educativos integrados para uso sin conexion.'
        ''
        'WEBVIEW2'
        'Si Microsoft Edge WebView2 no esta instalado, el instalador intentara descargarlo.'
        'Solo ese caso requiere conexion durante la instalacion.'
        ''
        'SEGURIDAD'
        $signatureExplanation
        'Verifica el SHA-256 antes de distribuir o instalar una copia descargada.'
        ''
        'DATOS Y DESINSTALACION'
        'Perfiles, notas, sesiones, evidencias, mediciones y fotografias permanecen en el equipo.'
        'Crea un backup completo desde Metrologia antes de cambiar de equipo o restaurar datos.'
        'Desinstala desde Configuracion > Aplicaciones > Aplicaciones instaladas.'
        'La desinstalacion de la aplicacion no debe usarse como sustituto de una copia de seguridad.'
    )
    Set-Content -LiteralPath (Join-Path $releaseDir "LEEME-INSTALACION-v$($package.version).txt") -Value $readme -Encoding utf8
    Set-Content -LiteralPath (Join-Path $releaseDir 'LEEME-INSTALACION.txt') -Value $readme -Encoding utf8

    # Conservar una sola publicacion instalable evita que una compilacion antigua
    # se confunda con la entrega vigente. La limpieza ocurre solo despues de que
    # el nuevo ejecutable, hash, manifiesto y guia se hayan escrito y validado.
    $currentReleaseNames = @(
        $clearName,
        "$clearName.sha256.txt",
        "release-manifest-v$($package.version).json",
        'release-manifest.json',
        "LEEME-INSTALACION-v$($package.version).txt",
        'LEEME-INSTALACION.txt'
    )
    $staleReleasePatterns = @(
        'WatchPrototypeLab-Instalador-Windows-x64-v*.exe',
        'WatchPrototypeLab-Instalador-Windows-x64-v*.exe.sha256.txt',
        'release-manifest-v*.json',
        'LEEME-INSTALACION-v*.txt'
    )
    foreach ($pattern in $staleReleasePatterns) {
        Get-ChildItem -LiteralPath $releaseDir -File -Filter $pattern |
            Where-Object { $_.Name -notin $currentReleaseNames } |
            Remove-Item -Force
    }
    Get-ChildItem -LiteralPath $bundleDir -File -Filter '*_x64-setup.exe' |
        Where-Object { $_.FullName -ne $installer.FullName } |
        Remove-Item -Force

    Write-Host ''
    Write-Host 'Instalador listo' -ForegroundColor Green
    Write-Host "  Archivo: $clearPath"
    Write-Host "  Tamano:  $sizeMb MB"
    Write-Host "  SHA-256: $($hash.Hash.ToLowerInvariant())"
    Write-Host "  Firma:   $signatureStatus"
    Write-Host "  Guia:    $(Join-Path $releaseDir 'LEEME-INSTALACION.txt')"
    Write-Host "  Manifest: $(Join-Path $releaseDir 'release-manifest.json')"
} finally {
    Pop-Location
}
