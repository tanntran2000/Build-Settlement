$ErrorActionPreference='Stop'
$c=$PSScriptRoot
$f=Join-Path $c 'final'
$d=(Resolve-Path -LiteralPath (Join-Path $c '..')).ProviderPath
if(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue){throw 'Preview ports remain in use'}
$m=Get-Content -Raw -Encoding UTF8 "$f/b2-3-measurements.json" | ConvertFrom-Json
if($m.head -ne (git rev-parse HEAD) -or $m.tree -ne (git rev-parse 'HEAD^{tree}') -or (git status --porcelain=v1 --untracked-files=all)){throw 'Unexpected product state'}
if((Get-Content -Raw -Encoding UTF8 "$f/b2-3-smoke.txt") -notmatch '(?m)^Exit [0-9]+\s*$'){throw 'Full smoke is still running'}
if($m.screenshotAssetBytesChanged){
  python -X utf8 "$d/run-evidence.py" 'correction-11/final/b2-3-screenshots' node "$f/capture-final.mjs" $f
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
& "$f/capture-environment.ps1" after
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
python -X utf8 "$c/write-readme.py"
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
python -X utf8 "$c/write-manifests.py"
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Push-Location $d
try {
  & 'C:/Program Files/Git/bin/bash.exe' --noprofile --norc -c 'sha256sum -c --quiet --strict SHA256SUMS.txt'
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
} finally {Pop-Location}
git status --porcelain=v1 --untracked-files=all
exit $LASTEXITCODE
