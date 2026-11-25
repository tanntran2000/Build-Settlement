$ErrorActionPreference='Stop'
$runner=Join-Path $PSScriptRoot 'run.py'
function Run-Evidence([string]$name,[string[]]$arguments){
  python $runner $name @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
Run-Evidence 'final-path-diff' @('node','packages/simulation/src/__tests__/fixtures/p7b-b3-path-diff.ts')
Run-Evidence 'final-artifacts' @('python',"$PSScriptRoot/archive-final-artifacts.py")
Run-Evidence 'exact-head-screenshots' @('node',"$PSScriptRoot/capture-screenshots.mjs","$PSScriptRoot/screenshots")
& "$PSScriptRoot/capture-environment.ps1" 'before-timings'
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$since=(Get-Content -Encoding UTF8 "$PSScriptRoot/environment-before-timings.txt" -TotalCount 1).Substring(4)
python $runner 'paired-end-week-and-load' 'python' "$PSScriptRoot/paired-timings.py"
$timing=$LASTEXITCODE
& "$PSScriptRoot/capture-environment.ps1" 'after-timings' $since
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Run-Evidence 'final-worktree' @('powershell.exe','-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',"$PSScriptRoot/capture-final-worktree.ps1")
exit $timing
