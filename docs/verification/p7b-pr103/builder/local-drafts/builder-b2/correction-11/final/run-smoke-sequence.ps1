$ErrorActionPreference='Stop'
$f=$PSScriptRoot
$d=(Resolve-Path -LiteralPath (Join-Path $f '../..')).ProviderPath
$gates=Get-Content -Encoding UTF8 -Raw "$f/b2-3-gates.json" | ConvertFrom-Json
if($gates.head -ne (git rev-parse HEAD) -or $gates.tree -ne (git rev-parse 'HEAD^{tree}') -or $gates.exits.Count -ne 7 -or ($gates.exits | Where-Object {$_ -ne 0})){throw 'All seven exact-head gates must pass first'}
if(git status --porcelain=v1 --untracked-files=all){throw 'Worktree must be clean'}
if(Test-Path -LiteralPath "$f/b2-3-smoke.txt"){throw 'The full smoke has already been launched'}
python -X utf8 "$d/run-evidence.py" 'correction-11/final/b2-3-regression-build' npm run build:regression --workspace=@haven/ui
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
if(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue){throw 'Preview ports are occupied'}
python -X utf8 "$d/run-evidence.py" 'correction-11/final/b2-3-served-check-and-bundle' node "$f/measure-bundle-and-save.mjs" $f
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& "$f/capture-environment.ps1" before-smoke
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
python -X utf8 "$f/launch-final-smoke.py"
$smokeExit=$LASTEXITCODE
if($smokeExit -ne 0 -and (Test-Path -LiteralPath "$f/b2-3-smoke.json")){
  $result=Get-Content -Raw -Encoding UTF8 "$f/b2-3-smoke.json" | ConvertFrom-Json
  if($result.stats.unexpected -gt 0){
    if(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue){throw 'Smoke preview ports remain occupied'}
    python -X utf8 "$f/rerun-final-smoke-failures.py"
    if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  }
}
exit $smokeExit
