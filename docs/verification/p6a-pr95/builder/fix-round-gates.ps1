$ErrorActionPreference = 'Stop'
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6a-prC'
if ((git status --porcelain=v1)) { throw 'HOLD: final head must be clean before gates' }
$gateCommands = @(
  @('fix-gate1-diff','git diff --check origin/main...HEAD'),
  @('fix-gate2-lint','npm run lint'),
  @('fix-gate3-typecheck','npm run typecheck'),
  @('fix-gate4-architecture','npm run check:architecture'),
  @('fix-gate5-architecture-tests','npm run test:architecture'),
  @('fix-gate6-unit','npm test'),
  @('fix-gate7-build','npm run build')
)
foreach ($gate in $gateCommands) {
  node "$taskRoot/run-evidence.mjs" $gate[0] $gate[1]
  if ($LASTEXITCODE -ne 0) { throw "HOLD: $($gate[0]) failed; exit $LASTEXITCODE" }
}
$portOwners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
@{ HEAD=(git rev-parse HEAD); tree=(git rev-parse 'HEAD^{tree}'); UTC=[DateTime]::UtcNow.ToString('o'); ports=@(4173,4174); listeners=$portOwners; exit=$portOwners.Count } | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 "$taskRoot/fix-round/ports-before-smoke.json"
if ($portOwners.Count) { $portOwners | ConvertTo-Json; throw 'HOLD: ports occupied before smoke; no process killed' }
Write-Output "CI=$env:CI"
$env:CI = '1'
node "$taskRoot/run-evidence.mjs" 'fix-smoke-full' 'echo CI=%CI% && npm run test:smoke -- --output=C:/Users/Admin/.t3/local-drafts/p6a-prC-playwright/fix-round-smoke'
if ($LASTEXITCODE -ne 0) { throw 'HOLD: smoke failed; isolate each failing case once and report both runs' }
