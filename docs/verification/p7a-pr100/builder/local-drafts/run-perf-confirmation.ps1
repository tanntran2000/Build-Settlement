$ErrorActionPreference = 'Stop'
$evidenceDir = 'C:/Users/Admin/.t3/local-drafts/p7a-prB'
Set-Location 'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01'
foreach ($name in @('perf-GREEN.json', 'perf-GREEN-final-session.json', 'B1-GREEN-perf.txt', 'B1-perf-machine.json')) {
    $saved = Join-Path $evidenceDir ($name + '.attempt1')
    if (Test-Path -LiteralPath $saved) { throw "Already preserved: $saved; do not rerun this script." }
    Copy-Item -LiteralPath (Join-Path $evidenceDir $name) -Destination $saved
}
$cpu = @(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,NumberOfLogicalProcessors)
$top = @(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin @('_Total','Idle') } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 10 IDProcess,Name,PercentProcessorTime)
$jobs = @(Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^(node|npm|python)(\.exe)?$' -and $_.CommandLine -match '(vitest|playwright|eslint|tsc\b|vite\s+(build|preview)|npm(?:\.cmd)?\s+(test|run\s+(build|test|lint|typecheck))|measure-npc-life|run-evidence\.py|codex\s+review)' } | Select-Object ProcessId,Name,CommandLine)
$ports = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
@{ utc=[DateTime]::UtcNow.ToString('o'); cpu=$cpu; topProcesses=$top; competingJobs=$jobs; portListeners=$ports } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidenceDir 'B1-perf-confirmation-machine.json') -Encoding UTF8
if ($jobs.Count -gt 0 -or $ports.Count -gt 0) { throw 'HOLD: competing job or held port. Nothing was killed.' }
python -X utf8 "$evidenceDir/run-evidence.py" B1-GREEN-perf-confirmation.txt -- node "$evidenceDir/measure-npc-life.mjs" GREEN
$measurementExit = $LASTEXITCODE
$windowStart = [DateTimeOffset]::Parse((Get-Content -LiteralPath "$evidenceDir/B1-perf-machine.json.attempt1" -Raw -Encoding UTF8 | ConvertFrom-Json).utc).UtcDateTime
$windowEnd = [DateTime]::UtcNow
$eventErrors = @()
$events = @(Get-WinEvent -FilterHashtable @{LogName='System'; StartTime=$windowStart; EndTime=$windowEnd; Id=@(1,42,107,506,507)} -ErrorAction SilentlyContinue -ErrorVariable eventErrors | Where-Object { $_.ProviderName -in @('Microsoft-Windows-Power-Troubleshooter','Microsoft-Windows-Kernel-Power') } | Select-Object @{Name='Utc';Expression={$_.TimeCreated.ToUniversalTime().ToString('o')}},Id,ProviderName,Message)
@{ startUtc=$windowStart.ToString('o'); endUtc=$windowEnd.ToString('o'); events=$events; queryErrors=@($eventErrors | ForEach-Object { $_.ToString() }); measurementExit=$measurementExit } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$evidenceDir/B1-perf-sleep-resume.json" -Encoding UTF8
Write-Output "MEASUREMENT_EXIT=$measurementExit"
exit $measurementExit
