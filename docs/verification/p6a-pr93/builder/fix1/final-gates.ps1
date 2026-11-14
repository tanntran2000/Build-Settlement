$ErrorActionPreference='Stop'
$OutputEncoding=[Console]::OutputEncoding=[Text.UTF8Encoding]::new()
$evidence='C:/Users/Admin/.t3/local-drafts/p6a-prA/fix1'
$dirty=@(git status --porcelain=v1)
if($dirty.Count){throw 'Final gates require a clean working tree'}
$commands=@('git diff --check origin/main...HEAD','npm run lint','npm run typecheck','npm run check:architecture','npm run test:architecture','npm test','npm run build')
for($i=0;$i -lt $commands.Count;$i++){
 Write-Output "Starting gate $($i+1): $($commands[$i])"
 & node "$evidence/run-stream.mjs" "a4-gate-$($i+1)" $commands[$i]
 if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
$listeners=@(Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(4173,4174)})
@("UTC: $([DateTime]::UtcNow.ToString('o'))", "Listeners on 4173/4174: $($listeners.Count)") | Set-Content -Encoding utf8 "$evidence/a4-ports-before.txt"
if($listeners.Count){
 $listeners | Format-List | Out-String | Add-Content -Encoding utf8 "$evidence/a4-ports-before.txt"
 throw 'HOLD: ports 4173/4174 are occupied; no process was killed'
}
$env:CI='1'
Write-Output "CI=$env:CI"
& node "$evidence/run-stream.mjs" 'a4-smoke' 'echo CI=%CI% && npm run test:smoke'
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& node "$evidence/run-stream.mjs" 'a4-bundle-final' 'node C:/Users/Admin/.t3/local-drafts/p6a-prA/fix1/measure-bundle.mjs --capture'
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$listeners=@(Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(4173,4174)})
@("UTC: $([DateTime]::UtcNow.ToString('o'))", "Listeners on 4173/4174: $($listeners.Count)") | Set-Content -Encoding utf8 "$evidence/a4-ports-after.txt"
if($listeners.Count){throw 'HOLD: smoke left occupied ports; no process was killed'}
git status --porcelain=v1
git rev-parse HEAD 'HEAD^{tree}'
exit 0
