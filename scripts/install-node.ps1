$ErrorActionPreference = 'Stop'
$tallyRoot = Split-Path -Parent $PSScriptRoot
$tallyTools = Join-Path $tallyRoot '.tools'
New-Item -ItemType Directory -Path $tallyTools -Force | Out-Null
$tallyVersions = Invoke-RestMethod 'https://nodejs.org/dist/index.json'
$tallyVersion = ($tallyVersions | Where-Object { $_.version -match '^v24\.' -and $_.lts } | Select-Object -First 1).version
if (-not $tallyVersion) { throw 'Could not find Node 24 LTS.' }
$tallyArchiveName = "node-$tallyVersion-win-x64.zip"
$tallyArchive = Join-Path $tallyTools $tallyArchiveName
Invoke-WebRequest "https://nodejs.org/dist/$tallyVersion/$tallyArchiveName" -UseBasicParsing -OutFile $tallyArchive
$tallyChecksums = (Invoke-WebRequest "https://nodejs.org/dist/$tallyVersion/SHASUMS256.txt" -UseBasicParsing).Content
$tallyExpected = (($tallyChecksums -split "`n" | Where-Object { $_.Trim().EndsWith($tallyArchiveName) }) -split '\s+')[0]
if ((Get-FileHash -LiteralPath $tallyArchive -Algorithm SHA256).Hash.ToLower() -ne $tallyExpected) { throw 'Node download checksum did not match.' }
Expand-Archive -LiteralPath $tallyArchive -DestinationPath $tallyTools -Force
Write-Output (Join-Path $tallyTools "node-$tallyVersion-win-x64")
