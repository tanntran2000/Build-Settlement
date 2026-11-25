$ErrorActionPreference='Stop'
$old=Get-Content -Raw -Encoding UTF8 "$PSScriptRoot/gate-8-smoke-delivery.txt"
$head=(git rev-parse HEAD).Trim()
if(!$old.Contains($head) -or !$old.Contains('416 passed') -or $old -notmatch '(?m)^Exit 1\s*$'){
    throw 'Waiting for the completed interrupted smoke log at this HEAD'
}
if(git status --porcelain=v1){throw 'Expected a clean worktree'}
$since=(Get-Content -Encoding UTF8 "$PSScriptRoot/environment-before-gates-delivery.txt" -TotalCount 1).Substring(4)
& "$PSScriptRoot/capture-environment.ps1" 'before-smoke-wake-confirm' $since
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$CI=1
$env:CI=[string]$CI
echo "CI=$CI"
python "$PSScriptRoot/run.py" workforce-after-wake node node_modules/@playwright/test/cli.js test workforce-draft-error.spec.ts -g 'still invalid clears only its old error at 390px'
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& "$PSScriptRoot/capture-environment.ps1" 'before-smoke-delivery-retry' $since
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$CI=1
$env:CI=[string]$CI
echo "CI=$CI"
python "$PSScriptRoot/run.py" gate-8-smoke-delivery-retry 'npm.cmd' 'run' 'test:smoke'
$smoke=$LASTEXITCODE
& "$PSScriptRoot/capture-environment.ps1" 'after-smoke-delivery-retry' $since
if($smoke -ne 0){exit $smoke}
exit $LASTEXITCODE

