$ErrorActionPreference = 'Stop'
$taskRoot = 'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01'
$taskEvidence = 'C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1'
Set-Location -LiteralPath $taskRoot
$pin = Get-Content -LiteralPath "$taskEvidence/B2-head.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$windowStart = [DateTime]::UtcNow
$operationalExit = 0
$failure = $null

function Assert-Revision {
    if ((& git rev-parse HEAD).Trim() -ne $pin.head -or (& git rev-parse 'HEAD^{tree}').Trim() -ne $pin.tree) { throw 'HOLD: HEAD/tree changed.' }
    if ((& git branch --show-current).Trim() -ne 'feat/p7a-npc-life-week' -or (& git status --porcelain=v1)) { throw 'HOLD: branch/status changed.' }
}

function Save-Machine([string]$Name) {
    $cpu = @(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,NumberOfLogicalProcessors)
    $top = @(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin @('_Total','Idle') } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 10 IDProcess,Name,PercentProcessorTime)
    $pattern = 'vitest|playwright|vite[\\/]bin|check-architecture|architecture\.test|tsc[\\/]|svelte-check|run-evidence|review-package|eslint|webpack|jest|pytest|gradle|codex\s+review'
    $jobs = @(Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^(node|python|python3|npm|npx|dotnet|java|codex|claude)\.exe$' -and $_.CommandLine -match $pattern } | ForEach-Object { [ordered]@{id=$_.ProcessId;parentId=$_.ParentProcessId;name=$_.Name;job=([regex]::Match($_.CommandLine,$pattern).Value)} })
    $ports = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
    [ordered]@{head=$pin.head;tree=$pin.tree;utc=[DateTime]::UtcNow.ToString('o');cpu=$cpu;topProcesses=$top;competingJobs=$jobs;portListeners=$ports} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$taskEvidence/$Name" -Encoding UTF8
    if ($jobs.Count) { throw "HOLD: competing job at $Name. Nothing was killed." }
    if ($ports.Count) { throw "HOLD: held port at $Name. Nothing was killed." }
    return ($cpu | ConvertTo-Json -Compress)
}

function Save-SleepEvents([datetime]$StartUtc, [datetime]$EndUtc, [string]$Name) {
    & powershell.exe -NoProfile -File "$taskEvidence/capture-sleep.ps1" -StartUtc $StartUtc.ToUniversalTime().ToString('o') -EndUtc $EndUtc.ToUniversalTime().ToString('o') -Destination "$taskEvidence/$Name"
    if ($LASTEXITCODE -ne 0) { throw 'HOLD: UTC sleep/resume query failed.' }
}

try {
    if (Test-Path -LiteralPath "$taskEvidence/gate-1-diff.txt") { throw 'HOLD: gate log exists; never overwrite a gate attempt.' }
    Assert-Revision
    $env:P7A_GATE_CPU = Save-Machine 'gate-start-machine.json'
    Save-SleepEvents $windowStart ([DateTime]::UtcNow) 'sleep-resume-start.json'
    $commands = @(
        @{Name='gate-1-diff.txt';Args=@('git','diff','--check','origin/main...HEAD')},
        @{Name='gate-2-lint.txt';Args=@('npm','run','lint')},
        @{Name='gate-3-typecheck.txt';Args=@('npm','run','typecheck')},
        @{Name='gate-4-architecture.txt';Args=@('npm','run','check:architecture')},
        @{Name='gate-5-architecture-tests.txt';Args=@('npm','run','test:architecture')},
        @{Name='gate-6-unit.txt';Args=@('npm','test')},
        @{Name='gate-7-build.txt';Args=@('npm','run','build')}
    )
    foreach ($gate in $commands) {
        Assert-Revision
        $arguments = @('-X','utf8',"$taskEvidence/run-evidence.py",$gate.Name,'--') + $gate.Args
        & python @arguments
        if ($LASTEXITCODE -ne 0) { $operationalExit=$LASTEXITCODE; throw "HOLD: $($gate.Name) failed." }
    }
    Assert-Revision
    & node "$taskEvidence/measure-bundle.mjs"
    if ($LASTEXITCODE -ne 0) { throw 'HOLD: bundle evidence failed.' }
    $env:P7A_SMOKE_CPU = Save-Machine 'pre-smoke-machine.json'
    $env:CI = '1'
    echo "CI=$env:CI"
    "CI=$env:CI" | Set-Content -LiteralPath "$taskEvidence/smoke-ci.txt" -Encoding UTF8
    & python -X utf8 "$taskEvidence/run-streamed-smoke.py"
    $operationalExit = $LASTEXITCODE
    if ($operationalExit -ne 0) { $failure='HOLD: full smoke or served-asset proof failed. Isolate each failed case once; no full rerun.' }
} catch {
    $failure = $_.Exception.Message
    if ($operationalExit -eq 0) { $operationalExit=2 }
    Write-Output $failure
} finally {
    try { Assert-Revision; $null=Save-Machine 'final-machine.json' }
    catch { $failure="$failure FINAL: $($_.Exception.Message)"; $operationalExit=2 }
    $windowEnd = [DateTime]::UtcNow
    try { Save-SleepEvents $windowStart $windowEnd 'sleep-resume-events.json' }
    catch { $failure="$failure SLEEP: $($_.Exception.Message)"; $operationalExit=2 }
    [ordered]@{head=(& git rev-parse HEAD).Trim();tree=(& git rev-parse 'HEAD^{tree}').Trim();branch=(& git branch --show-current).Trim();gitStatus=((& git status --porcelain=v1)-join "`n");windowStartUtc=$windowStart.ToString('o');windowEndUtc=$windowEnd.ToString('o');operationalExitCode=$operationalExit;failure=$failure} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath "$taskEvidence/B2-summary.json" -Encoding UTF8
}
exit $operationalExit
