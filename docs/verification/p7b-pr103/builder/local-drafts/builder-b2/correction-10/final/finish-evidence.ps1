$ErrorActionPreference='Stop'
$f=$PSScriptRoot
$c=(Resolve-Path -LiteralPath (Join-Path $f '..')).ProviderPath
$d=(Resolve-Path -LiteralPath (Join-Path $f '../..')).ProviderPath
$head=git rev-parse HEAD
$tree=git rev-parse 'HEAD^{tree}'
$bundle=Get-Content -Raw -Encoding UTF8 "$f/b2-3-measurements.json" | ConvertFrom-Json
$log=Get-Content -Raw -Encoding UTF8 "$f/b2-3-smoke.txt"
if($log -notmatch '(?m)^Exit [0-9]+\s*$'){throw 'Full smoke is still running'}
if($bundle.head -ne $head -or $bundle.tree -ne $tree -or (git status --porcelain=v1 --untracked-files=all)){throw 'Unexpected product state'}
if(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue){throw 'Preview ports remain in use'}
$prior=Get-Content -Raw -Encoding UTF8 "$d/b2-3-measurements.json" | ConvertFrom-Json
$sha=[Text.UTF8Encoding]::new($false)
$list="$c/storage-authorized-list.txt"
[IO.File]::WriteAllText($list,[IO.File]::ReadAllText($list),$sha)
if($bundle.screenshotAssetBytesChanged){
  $priorHall="$d/b2-3-hall-checkpoint.json"
  Copy-Item -LiteralPath $priorHall -Destination "$f/b2-3-hall-checkpoint.json"
  if((Get-FileHash -LiteralPath $priorHall).Hash -ne (Get-FileHash -LiteralPath "$f/b2-3-hall-checkpoint.json").Hash){throw 'Hall checkpoint bytes changed'}
  python -X utf8 "$d/run-evidence.py" 'correction-10/final/b2-3-screenshots' node "$f/capture-final.mjs" $f
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
& "$f/capture-environment.ps1" after
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
if(Test-Path -LiteralPath 'C:/Users/Admin/.t3/worktrees/Build-Settlement/b2-c10-benchmark-main'){throw 'Temporary benchmark checkout remains'}
python -X utf8 "$f/write-readme.py"
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
python -X utf8 "$f/write-final-manifests.py"
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Push-Location $d
try {
  & 'C:/Program Files/Git/bin/bash.exe' --noprofile --norc -c 'sha256sum -c --quiet --strict SHA256SUMS.txt'
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
} finally {Pop-Location}
git status --porcelain=v1 --untracked-files=all
exit $LASTEXITCODE
