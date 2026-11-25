param([switch]$BeforeSmokeOnly)
$ErrorActionPreference='Stop'
$runner=Join-Path $PSScriptRoot 'run.py'
function Run-Gate([string]$name,[string[]]$arguments){
  python $runner $name @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
if(!$BeforeSmokeOnly){
  & "$PSScriptRoot/capture-environment.ps1" 'before-gates'
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  Run-Gate 'gate-1-diff' @('git','diff','--check','origin/main...HEAD')
  Run-Gate 'gate-2-lint' @('npm.cmd','run','lint')
  Run-Gate 'gate-3-typecheck' @('npm.cmd','run','typecheck')
  Run-Gate 'gate-4-architecture' @('npm.cmd','run','check:architecture')
  Run-Gate 'gate-5-architecture-tests' @('npm.cmd','run','test:architecture')
  Run-Gate 'gate-6-unit' @('npm.cmd','test')
  Run-Gate 'gate-7-build' @('npm.cmd','run','build')
}
$since=(Get-Content -Encoding UTF8 "$PSScriptRoot/environment-before-gates.txt" -TotalCount 1).Substring(4)
Run-Gate 'before-smoke-regression-build' @('npm.cmd','run','build:regression','--workspace=@haven/ui')
Run-Gate 'before-smoke-served-hashes' @('node',"$PSScriptRoot/served-and-bundle.mjs",$PSScriptRoot)
& "$PSScriptRoot/capture-environment.ps1" 'before-smoke' $since
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$CI=1
$env:CI=[string]$CI
echo "CI=$CI"
python $runner 'gate-8-smoke' 'npm.cmd' 'run' 'test:smoke'
$smoke=$LASTEXITCODE
& "$PSScriptRoot/capture-environment.ps1" 'after-smoke' $since
$environment=$LASTEXITCODE
if($smoke -ne 0){exit $smoke}
exit $environment
