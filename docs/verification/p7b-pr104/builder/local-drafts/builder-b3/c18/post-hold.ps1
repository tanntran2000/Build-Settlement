$ErrorActionPreference='Stop'
$runner=Join-Path $PSScriptRoot 'run.py'
function Run-Evidence([string]$name,[string[]]$arguments){
  python $runner $name @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
Run-Evidence 'smoke-isolated-batch' @('python',"$PSScriptRoot/rerun-smoke-failures.py")
Run-Evidence 'original-smoke-artifacts' @('python',"$PSScriptRoot/capture-smoke-failures.py")
Run-Evidence 'final-artifacts' @('python',"$PSScriptRoot/archive-passed-measurements.py")
Run-Evidence 'final-path-diff' @('node','packages/simulation/src/__tests__/fixtures/p7b-b3-path-diff.ts')
Run-Evidence 'final-worktree' @('powershell.exe','-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',"$PSScriptRoot/capture-final-worktree.ps1")
