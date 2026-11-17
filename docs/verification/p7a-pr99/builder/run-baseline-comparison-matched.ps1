$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01'
$taskEvidence = 'C:\Users\Admin\.t3\local-drafts\p7a-prA'
$taskLocalOnly = 'C:\Users\Admin\.t3\local-drafts\p7a-prA-local-only'
$taskCompare = Join-Path $taskEvidence 'baseline-comparison-matched'
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

if (Test-Path -LiteralPath $taskCompare) { throw 'HOLD: comparison evidence directory already exists; will not overwrite runs.' }
New-Item -ItemType Directory -Path $taskCompare | Out-Null
$taskWindowStart = [DateTime]::UtcNow
$taskExit = 0
$taskRuns = @()
$taskFailure = $null
try {
    Assert-TaskRevision $taskHead
    if ((Get-TaskGit @('branch','--show-current')) -ne $taskBranch) { throw 'HOLD: start must be on the feature branch.' }
    Save-TaskMachine 'start-machine.json'
    $taskBaseLock = Get-TaskGit @('rev-parse',"${taskBase}:package-lock.json")
    $taskHeadLock = Get-TaskGit @('rev-parse',"${taskHead}:package-lock.json")
    [ordered]@{base=$taskBase;head=$taskHead;baseLockBlob=$taskBaseLock;headLockBlob=$taskHeadLock;identical=($taskBaseLock -eq $taskHeadLock);npmCiRun=$false} |
        ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare 'lockfile-check.json')
    if ($taskBaseLock -ne $taskHeadLock) { throw 'HOLD: unexpected lockfile difference; no installation performed.' }
    Copy-Item -LiteralPath (Join-Path $taskEvidence 'SHA256SUMS.txt') -Destination (Join-Path $taskCompare 'prior-SHA256SUMS.txt')
    $taskCases = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskEvidence 'smoke-failed-cases.json') | ConvertFrom-Json
    if ($taskCases.Count -ne 3) { throw 'HOLD: comparison requires exactly three approved cases.' }
    $env:CI = '1'
    echo "CI=$env:CI"
    foreach ($taskStage in @('base','head')) {
        if ($taskStage -eq 'base') {
            & git switch --detach $taskBase
            if ($LASTEXITCODE -ne 0) { throw 'HOLD: base checkout failed.' }
            $taskExpected = $taskBase
        } else {
            & git switch $taskBranch
            if ($LASTEXITCODE -ne 0) { throw 'HOLD: feature checkout failed.' }
            $taskExpected = $taskHead
        }
        Assert-TaskRevision $taskExpected
        Save-TaskMachine "$taskStage-build-machine.json"
        Write-Output "BUILD $taskStage : normal production build at $taskExpected"
        & python -X utf8 (Join-Path $taskEvidence 'run-evidence.py') "baseline-comparison-matched/$taskStage-build.txt" -- npm run build
        if ($LASTEXITCODE -ne 0) { throw 'HOLD: production build failed; no tests for this stage were run.' }
        $taskAssets = @(Get-ChildItem -LiteralPath (Join-Path $taskRoot 'packages/ui/dist/assets') -File | Where-Object { $_.Extension -in @('.js','.css') } | ForEach-Object { [ordered]@{name=$_.Name;bytes=$_.Length;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()} })
        [ordered]@{head=$taskExpected;tree=(Get-TaskGit @('rev-parse','HEAD^{tree}'));utc=[DateTime]::UtcNow.ToString('o');productionAssets=$taskAssets;indexHtml=([System.IO.File]::ReadAllText((Join-Path $taskRoot 'packages/ui/dist/index.html')))} | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare "$taskStage-built-assets.json")
        foreach ($taskCase in $taskCases) {
            if ($taskCase.selector -isnot [string] -or $taskCase.grep -isnot [string]) { throw 'HOLD: case selectors must be scalar strings.' }
            Assert-TaskRevision $taskExpected
            $taskStem = '{0}-{1}' -f $taskStage,$taskCase.index
            Save-TaskMachine "$taskStem-machine.json"
            $taskOutput = Join-Path $taskLocalOnly ("baseline-comparison-matched\$taskStem")
            if (Test-Path -LiteralPath $taskOutput) { throw 'HOLD: trace output directory already exists.' }
            Write-Output "START $taskStem : $($taskCase.title) at $taskExpected"
            # npm's unchanged pretest:smoke hook builds exactly as the regular smoke.
            $taskArgs = @('-X','utf8',(Join-Path $taskEvidence 'run-evidence.py'),"baseline-comparison-matched/$taskStem.txt",'--','npm','run','test:smoke','--',[string]$taskCase.selector,'--grep',[string]$taskCase.grep,'--workers=1','--output',$taskOutput)
            & python @taskArgs
            $taskRunExit = $LASTEXITCODE
            $taskRuns += [ordered]@{stage=$taskStage;index=$taskCase.index;case=$taskCase.title;head=$taskExpected;exitCode=$taskRunExit;log="baseline-comparison-matched/$taskStem.txt";traceOutput=$taskOutput}
            $taskRuns | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare 'runs.json')
            # A test failure is an expected diagnostic result; complete the six approved runs.
        }
    }
} catch {
    $taskFailure = $_.Exception.Message
    $taskExit = 2
    Write-Output $taskFailure
} finally {
    try {
        if ((Get-TaskGit @('branch','--show-current')) -ne $taskBranch) {
            & git switch $taskBranch
            if ($LASTEXITCODE -ne 0) { throw 'HOLD: failed to restore the feature branch.' }
        }
        Assert-TaskRevision $taskHead
        Save-TaskMachine 'final-machine.json'
    } catch {
        $taskFailure = "$taskFailure RESTORE/FINAL: $($_.Exception.Message)"
        $taskExit = 2
        Write-Output $taskFailure
    }
    $taskWindowEnd = [DateTime]::UtcNow
    try { Save-TaskSleepEvents $taskWindowStart $taskWindowEnd }
    catch { $taskFailure = "$taskFailure SLEEP-EVENT-QUERY: $($_.Exception.Message)"; $taskExit=2 }
    [ordered]@{windowStartUtc=$taskWindowStart.ToString('o');windowEndUtc=$taskWindowEnd.ToString('o');runs=$taskRuns;operationalExitCode=$taskExit;failure=$taskFailure;finalHead=(Get-TaskGit @('rev-parse','HEAD'));finalBranch=(Get-TaskGit @('branch','--show-current'));gitStatus=(Get-TaskGit @('status','--porcelain=v1'));state='HOLD after diagnostic comparison; no fixes'} |
        ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskCompare 'summary.json')
}
exit $taskExit
