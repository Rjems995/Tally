param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
$tallyRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$tallyTargets = @(
 'debug.log', 'data/server.log', 'data/server-error.log', '__pycache__', 'tests/__pycache__', 'scripts/__pycache__', 'test-results',
 'mobile/android/.gradle', 'mobile/android/.kotlin', 'mobile/android/build', 'mobile/android/app/build',
 'mobile/android/capacitor-cordova-android-plugins/build', 'mobile/ios/App/build', 'mobile/ios/DerivedData',
 '.tools/android-download', '.tools/commandlinetools-win-15859902_latest.zip', '.tools/node-v24.21.0-win-x64.zip',
 '.tools/OpenJDK21U-jdk_x64_windows_hotspot_21.0.12.1_1.zip', '.tools/gradle/.tmp', '.tools/gradle/caches', '.tools/gradle/daemon', '.tools/gradle/kotlin-profile',
 'node_modules/@capacitor/android/capacitor/build', 'node_modules/@capacitor/app/android/build',
 'node_modules/@capacitor/camera/android/build', 'node_modules/@capacitor/filesystem/android/build', 'node_modules/@capacitor/share/android/build'
)
$tallyBytes = [long]0
$tallyFailed = @()
foreach ($tallyRelative in $tallyTargets) {
 $tallyPath = [IO.Path]::GetFullPath((Join-Path $tallyRoot $tallyRelative))
 if (-not $tallyPath.StartsWith($tallyRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Path escapes workspace.' }
 if (-not (Test-Path -LiteralPath $tallyPath)) { continue }
 try {
  $tallyAncestor = $tallyPath
  while ($tallyAncestor.Length -ge $tallyRoot.Length) {
   if ((Get-Item -LiteralPath $tallyAncestor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Skipping symbolic link/junction.' }
   if ($tallyAncestor -eq $tallyRoot) { break }
   $tallyAncestor = Split-Path -Parent $tallyAncestor
  }
  $tallyItem = Get-Item -LiteralPath $tallyPath -Force
  if ($tallyItem.PSIsContainer) {
   $tallyContents = @(Get-ChildItem -LiteralPath $tallyPath -Recurse -Force)
   if ($tallyContents | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw 'Skipping directory containing symbolic links/junctions.' }
   $tallySize = ($tallyContents | Where-Object { -not $_.PSIsContainer } | Measure-Object Length -Sum).Sum
  } else { $tallySize = $tallyItem.Length }
  if ($DryRun) { Write-Output ('Would remove {0}: {1:N1} MB' -f $tallyRelative, ($tallySize / 1MB)) }
  else {
   Remove-Item -LiteralPath $tallyPath -Recurse -Force
   $tallyBytes += $tallySize
   Write-Output "Removed $tallyRelative"
  }
 } catch {
  $tallyFailed += $tallyRelative
  Write-Warning "Could not fully remove ${tallyRelative}: $($_.Exception.Message)"
 }
}
if (-not $DryRun) { Write-Output ('Reclaimed at least {0:N2} GB.' -f ($tallyBytes / 1GB)) }
if ($tallyFailed.Count) { exit 1 }
