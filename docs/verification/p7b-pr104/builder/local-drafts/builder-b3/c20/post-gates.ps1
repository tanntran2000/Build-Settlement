param([switch]$FailedSmoke)
$ErrorActionPreference='Stop'
$runner=Join-Path $PSScriptRoot 'run.py'
function Run-Evidence([string]$name,[string[]]$arguments){
  python $runner $name @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
if($FailedSmoke){
  Run-Evidence 'smoke-isolated-batch' @('python',"$PSScriptRoot/rerun-smoke-failures.py")
  Run-Evidence 'original-smoke-artifacts' @('python',"$PSScriptRoot/capture-smoke-failures.py")
}
Run-Evidence 'final-artifacts' @('python',"$PSScriptRoot/archive-bundle.py")
Run-Evidence 'final-worktree' @('powershell.exe','-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',"$PSScriptRoot/capture-final-worktree.ps1")
