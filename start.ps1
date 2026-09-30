$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$tallyPython = Join-Path $env:LOCALAPPDATA 'Python\pythoncore-3.14-64\python.exe'
if (Test-Path -LiteralPath $tallyPython) {
    & $tallyPython server.py
} else {
    python server.py
}
