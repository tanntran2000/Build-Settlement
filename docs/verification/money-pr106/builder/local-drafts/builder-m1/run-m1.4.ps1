param([ValidateRange(1,8)][int]$From=1,[ValidateRange(1,2)][int]$Attempt=1)
$ErrorActionPreference='Stop'
$head=((Get-Content "$PSScriptRoot/m1.3-commit.txt" -Encoding UTF8 | Select-String '^HEAD [0-9a-f]{40}$').Line).Substring(5)
$since=[DateTime]::UtcNow.ToString('o')
$tag="m1.4-attempt$Attempt"
$capture=Join-Path $PSScriptRoot 'capture-environment.ps1'
$runner=Join-Path $PSScriptRoot 'run-logged.py'
$env:VITEST_MAX_WORKERS='3'
Remove-Item Env:CI -ErrorAction SilentlyContinue
function Assert-Head {
  if((git rev-parse HEAD) -ne $head -or (git status --porcelain=v1)) { throw 'Exact head or clean status changed' }
  if((git rev-parse origin/main) -ne 'ab83228df9ee1c70f97c634324c3202e2def0ea0') { throw 'Unexpected baseline' }
}
function Capture-State([string]$label) {
  & $capture "$tag-$label" $since
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
function Run-Gate([int]$number,[string]$label,[string[]]$arguments) {
  if($number -lt $From){return}
  $log="$tag-gate-$number-$label.txt"
  if(Test-Path -LiteralPath "$PSScriptRoot/$log"){throw "Evidence already exists for $log"}
  Assert-Head
  python $runner $log @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  Assert-Head
}
Assert-Head
"VITEST_MAX_WORKERS=$env:VITEST_MAX_WORKERS" | Set-Content "$PSScriptRoot/$tag-unit-execution-environment.txt" -Encoding UTF8
Capture-State 'before-gates'
Run-Gate 1 'diff' @('git','diff','--check','origin/main...HEAD')
Run-Gate 2 'lint' @('npm.cmd','run','lint')
Run-Gate 3 'typecheck' @('npm.cmd','run','typecheck')
Run-Gate 4 'architecture' @('npm.cmd','run','check:architecture')
Run-Gate 5 'architecture-tests' @('npm.cmd','run','test:architecture')
Run-Gate 6 'unit' @('npm.cmd','test')
Run-Gate 7 'build' @('npm.cmd','run','build')
Capture-State 'before-smoke'
$env:CI='1'
Run-Gate 8 'smoke' @('npm.cmd','run','test:smoke')
Capture-State 'after-smoke'
exit 0
