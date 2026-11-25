param([int]$From = 1, [string]$Tag = '')
$ErrorActionPreference='Stop'
$runner=Join-Path $PSScriptRoot 'run.py'
if($From -eq 1){
  & "$PSScriptRoot/capture-environment.ps1" "before-gates$Tag"
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
function Run-Gate([int]$number,[string]$label,[string[]]$arguments){
  if($number -lt $From){return}
  python $runner "gate-$number-$label$Tag" @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
Run-Gate 1 'diff' @('git','diff','--check','origin/main...HEAD')
Run-Gate 2 'lint' @('npm.cmd','run','lint')
Run-Gate 3 'typecheck' @('npm.cmd','run','typecheck')
Run-Gate 4 'architecture' @('npm.cmd','run','check:architecture')
Run-Gate 5 'architecture-tests' @('npm.cmd','run','test:architecture')
Run-Gate 6 'unit' @('npm.cmd','test')
Run-Gate 7 'build' @('npm.cmd','run','build')
if($From -le 8) {
  $since=(Get-Content -Encoding UTF8 "$PSScriptRoot/environment-before-gates$Tag.txt" -TotalCount 1).Substring(4)
  & "$PSScriptRoot/capture-environment.ps1" "before-smoke$Tag" $since
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  $CI=1
  $env:CI=[string]$CI
  echo "CI=$CI"
  python $runner "gate-8-smoke$Tag" 'npm.cmd' 'run' 'test:smoke'
  $smoke=$LASTEXITCODE
  & "$PSScriptRoot/capture-environment.ps1" "after-smoke$Tag" $since
  $envResult=$LASTEXITCODE
  if($smoke -ne 0){exit $smoke}
  exit $envResult
}

