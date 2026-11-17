$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01'
$taskEvidence = 'C:\Users\Admin\.t3\local-drafts\p7a-prA'
$taskLocalOnly = 'C:\Users\Admin\.t3\local-drafts\p7a-prA-local-only'
Set-Location -LiteralPath $taskRoot
$taskCases = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskEvidence 'smoke-failed-cases.json') | ConvertFrom-Json
$taskAnyFailure = $false
foreach ($taskCase in $taskCases) {
    if ($taskCase.selector -isnot [string] -or $taskCase.grep -isnot [string]) { throw 'Isolation selector must be one case, not an array.' }
    if ((& git rev-parse HEAD).Trim() -ne '56124513aef2d85de128fe76bf3001654290c1c0' -or (& git status --porcelain=v1)) { throw 'HOLD: isolated rerun requires the same clean head.' }
    $taskJobs = @(Get-CimInstance Win32_Process | Where-Object {
        $_.Name -match '^(node|python|python3|npm)\.exe$' -and
        $_.CommandLine -match 'vitest|playwright|vite[\\/]bin|check-architecture|architecture\.test|tsc[\\/]|svelte-check|run-evidence|review-package'
    } | ForEach-Object { [pscustomobject]@{Id=$_.ProcessId;Name=$_.Name;Job=([regex]::Match($_.CommandLine,'vitest|playwright|vite|check-architecture|architecture\.test|tsc|svelte-check|run-evidence|review-package').Value)} })
    $taskPorts = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
    $taskCpu = @(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,NumberOfLogicalProcessors)
    [ordered]@{utc=[DateTime]::UtcNow.ToString('o');head=(& git rev-parse HEAD).Trim();case=$taskCase;cpu=$taskCpu;competingJobs=$taskJobs;portListeners=$taskPorts} | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskEvidence ("smoke-isolated-{0}-machine.json" -f $taskCase.index))
    if ($taskJobs.Count) { throw 'HOLD: another test/build/review command is running before isolated smoke.' }
    if ($taskPorts.Count) { throw 'HOLD: port 4173 or 4174 is held before isolated smoke. No process was killed.' }
    $env:CI='1'
    echo "CI=$env:CI"
    $taskOutput = Join-Path $taskLocalOnly ("isolated-{0}" -f $taskCase.index)
    $taskArgs = @('-X','utf8',(Join-Path $taskEvidence 'run-evidence.py'),("smoke-isolated-{0}.txt" -f $taskCase.index),'--','npm','run','test:smoke','--',[string]$taskCase.selector,'--grep',[string]$taskCase.grep,'--output',$taskOutput)
    & python @taskArgs
    if ($LASTEXITCODE -ne 0) { $taskAnyFailure=$true }
}
if ($taskAnyFailure) { exit 1 }
exit 0
