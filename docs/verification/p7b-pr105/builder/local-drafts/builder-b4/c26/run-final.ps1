param([ValidateRange(1,8)][int]$From=1,[ValidateRange(1,2)][int]$Attempt=1)
$ErrorActionPreference='Stop'
$head='90519b682846de9ad336c30db53f4b0b07afb2a2'
$tag=if($Attempt -eq 1){''}else{"-retry$Attempt"}
$runner=Join-Path $PSScriptRoot 'run.py'
$capture=Join-Path $PSScriptRoot 'capture-environment.ps1'
$since=(Get-Content -Encoding utf8 "$PSScriptRoot/environment-before-gates.txt" -TotalCount 1).Substring(4)
if ((git rev-parse HEAD) -ne $head -or (git status --porcelain=v1)) { throw 'Unexpected checkout before validation' }
if ($From -le 1 -and $Attempt -ne 1) {
  & $capture "before-gates$tag" $since
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
function Run-Gate([int]$number,[string]$label,[string[]]$arguments) {
  if($number -lt $From){return}
  $log="gate-$number-$label$tag"
  if(Test-Path -LiteralPath "$PSScriptRoot/$log.txt"){throw "Log already exists for $log"}
  python $runner $log @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  if ((git rev-parse HEAD) -ne $head -or (git status --porcelain=v1)) { throw "Checkout changed during $log" }
}
Run-Gate 1 'diff' @('git','diff','--check','origin/main...HEAD')
Run-Gate 2 'lint' @('npm.cmd','run','lint')
Run-Gate 3 'typecheck' @('npm.cmd','run','typecheck')
Run-Gate 4 'architecture' @('npm.cmd','run','check:architecture')
Run-Gate 5 'architecture-tests' @('npm.cmd','run','test:architecture')
Run-Gate 6 'unit' @('npm.cmd','test')
Run-Gate 7 'build' @('npm.cmd','run','build')
& $capture "before-smoke$tag" $since
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$env:CI='1'
Run-Gate 8 'smoke' @('python', (Join-Path $PSScriptRoot 'with-awake.py'), 'npm.cmd','run','test:smoke')
& $capture "after-smoke$tag" $since
exit $LASTEXITCODE
