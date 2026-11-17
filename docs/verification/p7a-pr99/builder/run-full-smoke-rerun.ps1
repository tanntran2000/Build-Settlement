$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01'
$taskEvidence = 'C:\Users\Admin\.t3\local-drafts\p7a-prA'
$taskLocalOnly = 'C:\Users\Admin\.t3\local-drafts\p7a-prA-local-only'
$taskCompare = Join-Path $taskEvidence 'full-smoke-rerun'
$taskBase = '753e4503673df86830fba2ef2c9ef1e64a843729'
$taskHead = '56124513aef2d85de128fe76bf3001654290c1c0'
$taskBranch = 'feat/p7a-npc-life-data'
Set-Location -LiteralPath $taskRoot

function Get-TaskGit([string[]]$GitArguments) {
    $taskValue = & git @GitArguments
    if ($LASTEXITCODE -ne 0) { throw "Git command failed: $GitArguments" }
    return ($taskValue -join "`n").Trim()
}

function Assert-TaskRevision([string]$ExpectedHead) {
    if ((Get-TaskGit @('rev-parse','HEAD')) -ne $ExpectedHead) { throw 'HOLD: unexpected comparison HEAD.' }
    if (Get-TaskGit @('status','--porcelain=v1')) { throw 'HOLD: comparison requires clean git status.' }
    if ((Get-TaskGit @('rev-parse',"refs/heads/$taskBranch")) -ne $taskHead) { throw 'HOLD: feature branch moved.' }
}

function Save-TaskMachine([string]$Name) {
    # Record CPU and top processes before permitting a build/test to start.
    $taskCpu = @(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,NumberOfLogicalProcessors)
    $taskTop = @(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin @('_Total','Idle') } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 10 IDProcess,Name,PercentProcessorTime)
    $taskJobs = @(Get-CimInstance Win32_Process | Where-Object {
        $_.Name -match '^(node|python|python3|npm|npx|dotnet|java)\.exe$' -and
        $_.CommandLine -match 'vitest|playwright|vite[\\/]bin|check-architecture|architecture\.test|tsc[\\/]|svelte-check|run-evidence|review-package|eslint|webpack|jest|pytest|gradle'
    } | ForEach-Object { [pscustomobject]@{
        Id=$_.ProcessId; ParentId=$_.ParentProcessId; Name=$_.Name
        Job=([regex]::Match($_.CommandLine,'vitest|playwright|vite|check-architecture|architecture\.test|tsc|svelte-check|run-evidence|review-package|eslint|webpack|jest|pytest|gradle').Value)
    } })
    $taskPorts = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
    [ordered]@{
        utc=[DateTime]::UtcNow.ToString('o'); head=(Get-TaskGit @('rev-parse','HEAD'))
        tree=(Get-TaskGit @('rev-parse','HEAD^{tree}')); branch=(Get-TaskGit @('branch','--show-current'))
        cpu=$taskCpu; topProcesses=$taskTop; competingJobs=$taskJobs; portListeners=$taskPorts
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare $Name)
    if ($taskJobs.Count) { throw "HOLD: competing job before $Name; no job was killed." }
    if ($taskPorts.Count) { throw "HOLD: port 4173/4174 held before $Name; no process was killed." }
}

function Save-TaskSleepEvents([datetime]$StartUtc, [datetime]$EndUtc) {
    $taskEvents = @()
    $taskQueries = @(
        @{LogName='System'; ProviderName='Microsoft-Windows-Power-Troubleshooter'; Id=1; StartTime=$StartUtc; EndTime=$EndUtc},
        @{LogName='System'; ProviderName='Microsoft-Windows-Kernel-Power'; Id=@(42,107,506,507); StartTime=$StartUtc; EndTime=$EndUtc}
    )
    foreach ($taskQuery in $taskQueries) {
        try { $taskMatches = @(Get-WinEvent -FilterHashtable $taskQuery -ErrorAction Stop) }
        catch {
            if ($_.FullyQualifiedErrorId -match 'NoMatchingEventsFound') { $taskMatches = @() }
            else { throw }
        }
        $taskEvents += @($taskMatches | ForEach-Object { [ordered]@{
            utc=$_.TimeCreated.ToUniversalTime().ToString('o'); id=$_.Id
            provider=$_.ProviderName; recordId=$_.RecordId; xml=$_.ToXml()
        } })
    }
    [ordered]@{windowStartUtc=$StartUtc.ToString('o'); windowEndUtc=$EndUtc.ToString('o'); events=$taskEvents; eventCount=$taskEvents.Count} |
        ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare 'sleep-resume-events.json')
}


if (Test-Path -LiteralPath $taskCompare) { throw 'HOLD: rerun folder already exists; no second full run.' }
New-Item -ItemType Directory -Path $taskCompare | Out-Null
$taskWindowStart = [DateTime]::UtcNow
$taskOperationalExit = 0
$taskFailure = $null
try {
    Assert-TaskRevision $taskHead
    if ((Get-TaskGit @('rev-parse','HEAD^{tree}')) -ne 'd2f31706d77d308a310b61857a8b293a898280e7') { throw 'HOLD: tree changed.' }
    if ((Get-TaskGit @('branch','--show-current')) -ne $taskBranch) { throw 'HOLD: wrong branch.' }
    Save-TaskMachine 'start-machine.json'
    Copy-Item -LiteralPath (Join-Path $taskEvidence 'SHA256SUMS.txt') -Destination (Join-Path $taskCompare 'prior-SHA256SUMS.txt')
    & python -X utf8 (Join-Path $taskEvidence 'run-evidence.py') 'full-smoke-rerun/production-build.txt' -- npm run build
    if ($LASTEXITCODE -ne 0) { throw 'HOLD: fresh production build failed.' }
    Assert-TaskRevision $taskHead
    $taskAssets = @(Get-ChildItem -LiteralPath (Join-Path $taskRoot 'packages/ui/dist/assets') -File | Where-Object { $_.Extension -in @('.js','.css') } | ForEach-Object { [ordered]@{name=$_.Name;bytes=$_.Length;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()} })
    $taskJs = @($taskAssets | Where-Object { $_.name.EndsWith('.js') })
    if ($taskJs.Count -ne 1 -or $taskJs[0].sha256 -ne '7013ff433ef7c8f2880b23ee4d92adfb749c2d0a1deba5af41267243857fd820') { throw 'HOLD: fresh production asset differs from pinned HEAD artifact.' }
    [ordered]@{head=$taskHead;tree=(Get-TaskGit @('rev-parse','HEAD^{tree}'));utc=[DateTime]::UtcNow.ToString('o');productionAssets=$taskAssets;indexHtml=([System.IO.File]::ReadAllText((Join-Path $taskRoot 'packages/ui/dist/index.html')))} | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare 'built-assets.json')
    Save-TaskMachine 'pre-smoke-machine.json'
    $taskSnapshot = [System.IO.File]::ReadAllText((Join-Path $taskCompare 'pre-smoke-machine.json')) | ConvertFrom-Json
    $env:P7A_SMOKE_CPU = ($taskSnapshot.cpu | ConvertTo-Json -Compress)
    $env:CI = '1'
    echo "CI=$env:CI"
    "CI=$env:CI" | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare 'ci-echo.txt')
    & python -X utf8 (Join-Path $taskEvidence 'run-streamed-smoke.py')
    $taskOperationalExit = $LASTEXITCODE
} catch {
    $taskFailure = $_.Exception.Message
    $taskOperationalExit = 2
    Write-Output $taskFailure
} finally {
    try { Assert-TaskRevision $taskHead; Save-TaskMachine 'final-machine.json' }
    catch { $taskFailure = "$taskFailure FINAL: $($_.Exception.Message)"; $taskOperationalExit = 2 }
    $taskWindowEnd = [DateTime]::UtcNow
    try { Save-TaskSleepEvents $taskWindowStart $taskWindowEnd }
    catch { $taskFailure = "$taskFailure SLEEP: $($_.Exception.Message)"; $taskOperationalExit=2 }
    [ordered]@{head=(Get-TaskGit @('rev-parse','HEAD'));tree=(Get-TaskGit @('rev-parse','HEAD^{tree}'));branch=(Get-TaskGit @('branch','--show-current'));gitStatus=(Get-TaskGit @('status','--porcelain=v1'));windowStartUtc=$taskWindowStart.ToString('o');windowEndUtc=$taskWindowEnd.ToString('o');operationalExitCode=$taskOperationalExit;failure=$taskFailure} | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare 'summary.json')
}
exit $taskOperationalExit
