$ErrorActionPreference = 'Stop'
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6a-prC'
$failures = Get-Content "$taskRoot/smoke-failures.json" -Raw -Encoding utf8 | ConvertFrom-Json
$env:CI = '1'
$results = @()
foreach ($failure in $failures) {
  $ports = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(4173,4174) })
  if ($ports.Count) { throw 'HOLD: ports occupied before isolated rerun; no process killed' }
  $command = 'npx playwright test {0}:{1} {2} --output=C:/Users/Admin/.t3/local-drafts/p6a-prC-playwright/{3}' -f $failure.file,$failure.line,$failure.filter,$failure.log
  node "$taskRoot/run-evidence.mjs" $failure.log $command
  $results += [PSCustomObject]@{log=$failure.log;exit=$LASTEXITCODE}
}
$results | ConvertTo-Json | Out-File "$taskRoot/smoke-rerun-exits.json" -Encoding utf8
if (@($results | Where-Object { $_.exit -ne 0 }).Count) { exit 1 }
exit 0
