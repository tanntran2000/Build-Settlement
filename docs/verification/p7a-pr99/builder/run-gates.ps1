$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01'
$taskEvidence = 'C:\Users\Admin\.t3\local-drafts\p7a-prA'
Set-Location -LiteralPath $taskRoot
$taskHead = (& git rev-parse HEAD).Trim()
$taskTree = (& git rev-parse 'HEAD^{tree}').Trim()
if ((& git status --porcelain=v1)) { throw 'HOLD: gate start requires an empty git status.' }
$taskJobs = @(Get-CimInstance Win32_Process | Where-Object {
    $_.Name -match '^(node|python|python3|npm)\.exe$' -and
    $_.CommandLine -match 'vitest|playwright|vite[\\/]bin|check-architecture|architecture\.test|tsc[\\/]|svelte-check|run-evidence|review-package'
} | ForEach-Object {
    [pscustomobject]@{ Id=$_.ProcessId; ParentId=$_.ParentProcessId; Name=$_.Name; Job=([regex]::Match($_.CommandLine,'vitest|playwright|vite|check-architecture|architecture\.test|tsc|svelte-check|run-evidence|review-package').Value) }
})
$taskPorts = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
$taskCpu = @(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,NumberOfLogicalProcessors)
$taskTop = @(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin @('_Total','Idle') } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 10 IDProcess,Name,PercentProcessorTime)
$taskSnapshot = [ordered]@{head=$taskHead;tree=$taskTree;utc=[DateTime]::UtcNow.ToString('o');cpu=$taskCpu;topProcesses=$taskTop;competingJobs=$taskJobs;portListeners=$taskPorts}
$taskSnapshot | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $taskEvidence 'gate-start-machine.json') -Encoding UTF8
if ($taskJobs.Count) { throw 'HOLD: another test, build or review command is running. See gate-start-machine.json.' }
if ($taskPorts.Count) { throw 'HOLD: port 4173 or 4174 is held. See gate-start-machine.json. No process was killed.' }
$env:P7A_GATE_CPU = ($taskCpu | ConvertTo-Json -Compress)
$taskCommands = @(
    @{Name='gate-1-diff.txt'; Args=@('git','diff','--check','origin/main...HEAD')},
    @{Name='gate-2-lint.txt'; Args=@('npm','run','lint')},
    @{Name='gate-3-typecheck.txt'; Args=@('npm','run','typecheck')},
    @{Name='gate-4-architecture.txt'; Args=@('npm','run','check:architecture')},
    @{Name='gate-5-architecture-tests.txt'; Args=@('npm','run','test:architecture')},
    @{Name='gate-6-unit.txt'; Args=@('npm','test')},
    @{Name='gate-7-build.txt'; Args=@('npm','run','build')}
)
foreach ($taskGate in $taskCommands) {
    if ((& git rev-parse HEAD).Trim() -ne $taskHead -or (& git status --porcelain=v1)) { throw 'HOLD: head/status changed during gates.' }
    $taskArgs = @('-X','utf8',(Join-Path $taskEvidence 'run-evidence.py'),$taskGate.Name,'--') + $taskGate.Args
    & python @taskArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
# Preserve the production bundle immediately after build, before smoke's separate regression build.
& node (Join-Path $taskEvidence 'measure-bundle.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$taskPorts = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
$taskPorts | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $taskEvidence 'pre-smoke-ports.json') -Encoding UTF8
if ($taskPorts.Count) { throw 'HOLD: port 4173 or 4174 is held before smoke. No process was killed.' }
$env:CI = '1'
echo "CI=$env:CI"
"CI=$env:CI" | Set-Content -LiteralPath (Join-Path $taskEvidence 'smoke-ci.txt') -Encoding UTF8
& python -X utf8 (Join-Path $taskEvidence 'run-evidence.py') 'smoke-CI1.txt' -- npm run test:smoke
exit $LASTEXITCODE
