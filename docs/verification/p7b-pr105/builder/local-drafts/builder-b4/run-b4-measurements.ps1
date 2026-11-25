$ErrorActionPreference='Stop'
$testLog=Join-Path $PSScriptRoot 'gate-8-smoke-delivery-retry.txt'
$head=(git rev-parse HEAD).Trim()
$tree=(git rev-parse 'HEAD^{tree}').Trim()
$log=Get-Content -LiteralPath $testLog -Raw -Encoding UTF8
if(!$log.Contains($head) -or !$log.Contains($tree) -or !$log.Contains('CI=1') -or !$log.Contains('417 passed') -or $log -notmatch '(?m)^Exit 0\s*$'){
  throw 'Exact-head full smoke evidence is incomplete'
}
if(git status --porcelain=v1){throw 'Expected a clean worktree'}
$fixture=@(Get-ChildItem -Path test-results -Filter largest-save-measurement.json -File -Recurse)
if($fixture.Count -ne 1){throw 'Expected exactly one largest-save artifact from full smoke'}
$src=$fixture[0].Directory.FullName
$out=Join-Path $PSScriptRoot 'save-size/delivery-smoke'
New-Item -ItemType Directory -Path $out -Force | Out-Null
Copy-Item -LiteralPath "$src/largest-save.json","$src/largest-save-indexeddb-rows.json","$src/largest-save-measurement.json" -Destination $out
$source=Join-Path $out 'largest-save.json'
$since=(Get-Content -Encoding UTF8 "$PSScriptRoot/environment-before-gates-delivery.txt" -TotalCount 1).Substring(4)
& "$PSScriptRoot/capture-environment.ps1" 'before-bundle-save' $since
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
python "$PSScriptRoot/run.py" served-bundle-and-largest-save node "$PSScriptRoot/measure-bundle-save.mjs" $PSScriptRoot $source
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& "$PSScriptRoot/capture-environment.ps1" 'before-timings' $since
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
python "$PSScriptRoot/run.py" paired-end-week-timings python "$PSScriptRoot/paired-b4-timings.py" $source
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& "$PSScriptRoot/capture-environment.ps1" 'after-timings' $since
exit $LASTEXITCODE

