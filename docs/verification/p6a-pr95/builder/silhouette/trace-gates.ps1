$ErrorActionPreference = 'Stop'
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6a-prC'
if ((git status --porcelain=v1)) { throw 'HOLD: final head must be clean before gates' }
$gateCommands = @(
  @('trace-gate1-diff','git diff --check origin/main...HEAD'),
  @('trace-gate2-lint','npm run lint'),
  @('trace-gate3-typecheck','npm run typecheck'),
  @('trace-gate4-architecture','npm run check:architecture'),
  @('trace-gate5-architecture-tests','npm run test:architecture'),
  @('trace-gate6-unit','npm test'),
  @('trace-gate7-build','npm run build')
)
foreach ($gate in $gateCommands) {
  node "$taskRoot/run-evidence.mjs" $gate[0] $gate[1]
  if ($LASTEXITCODE -ne 0) {
    if ($gate[0] -eq 'trace-gate6-unit') {
      $text = Get-Content -Raw -Encoding utf8 "$taskRoot/trace-gate6-unit.txt"
      $knownTimeout = @($text -split '\r?\n FAIL ' | Select-Object -Skip 1 | Where-Object { $_ -match '^packages/simulation/src/__tests__/(lord-health|society-renewable-support)\.test\.ts' -and $_ -match 'Error: Test timed out in 5000ms' })
      if ($knownTimeout.Count) { node "$taskRoot/silhouette/measure-timeouts.mjs" }
    }
    throw "HOLD: $($gate[0]) failed; no timeout changed"
  }
}
$portOwners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
@{ HEAD=(git rev-parse HEAD); tree=(git rev-parse 'HEAD^{tree}'); UTC=[DateTime]::UtcNow.ToString('o'); listeners=$portOwners; exit=$portOwners.Count } | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 "$taskRoot/silhouette/ports-before-smoke.json"
if ($portOwners.Count) { $portOwners | ConvertTo-Json; throw 'HOLD: ports occupied before smoke; no process killed' }
Write-Output "CI=$env:CI"
$env:CI = '1'
node "$taskRoot/run-evidence.mjs" 'trace-smoke-full' 'echo CI=%CI% && npm run test:smoke -- --output=C:/Users/Admin/.t3/local-drafts/p6a-prC-playwright/trace-smoke'
if ($LASTEXITCODE -ne 0) { throw 'HOLD: smoke failed; isolate each failing case once and report both runs' }
