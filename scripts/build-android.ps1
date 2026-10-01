param([switch]$Release)
$ErrorActionPreference = 'Stop'
$tallyRoot = Split-Path -Parent $PSScriptRoot
$tallyEnvironmentFile = Join-Path $tallyRoot '.tools/android-env.json'
if (Test-Path -LiteralPath $tallyEnvironmentFile) {
    $tallyEnvironment = Get-Content -LiteralPath $tallyEnvironmentFile -Raw | ConvertFrom-Json
    $env:JAVA_HOME = $tallyEnvironment.JAVA_HOME
    $env:ANDROID_HOME = $tallyEnvironment.ANDROID_HOME
    $env:ANDROID_USER_HOME = $tallyEnvironment.ANDROID_USER_HOME
    $env:GRADLE_USER_HOME = $tallyEnvironment.GRADLE_USER_HOME
    $env:Path = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:Path
}
Push-Location (Join-Path $tallyRoot 'mobile/android')
try {
    if ($Release) { & .\gradlew.bat bundleRelease --no-daemon --no-watch-fs --max-workers=1 }
    else { & .\gradlew.bat assembleDebug --no-daemon --no-watch-fs --max-workers=1 }
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
    $tallyOutput = Join-Path $tallyRoot 'releases'
    New-Item -ItemType Directory -Path $tallyOutput -Force | Out-Null
    if ($Release) {
        Copy-Item -LiteralPath 'app/build/outputs/bundle/release/app-release.aab' -Destination (Join-Path $tallyOutput 'Tally-release.aab')
    } else {
        Copy-Item -LiteralPath 'app/build/outputs/apk/debug/app-debug.apk' -Destination (Join-Path $tallyOutput 'Tally-preview.apk')
    }
    Write-Output "Build copied to $tallyOutput"
} finally { Pop-Location }
