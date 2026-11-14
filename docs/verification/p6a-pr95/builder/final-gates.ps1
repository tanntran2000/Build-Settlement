$ErrorActionPreference = 'Stop'
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6a-prC'
if ((git status --porcelain=v1)) { throw 'HOLD: final head must be clean before gates' }
$gateCommands = @(
  @('gate1-diff','git diff --check origin/main...HEAD'),
  @('gate2-lint','npm run lint'),
  @('gate3-typecheck','npm run typecheck'),
  @('gate4-architecture','npm run check:architecture'),
  @('gate5-architecture-tests','npm run test:architecture'),
  @('gate6-unit','npm test'),
  @('gate7-build','npm run build')
)
foreach ($gate in $gateCommands) {
  node "$taskRoot/run-evidence.mjs" $gate[0] $gate[1]
  if ($LASTEXITCODE -ne 0) { throw "HOLD: $($gate[0]) failed; exit $LASTEXITCODE" }
}
$portOwners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
if ($portOwners.Count) { $portOwners | ConvertTo-Json; throw 'HOLD: ports occupied before smoke; no process killed' }
Write-Output "CI=$env:CI"
$env:CI = '1'
node "$taskRoot/run-evidence.mjs" 'smoke-full' 'echo CI=%CI% && npm run test:smoke -- --output=C:/Users/Admin/.t3/local-drafts/p6a-prC-playwright/final-smoke'
if ($LASTEXITCODE -ne 0) { throw 'HOLD: smoke failed; isolate the failing test once, then report both runs' }
