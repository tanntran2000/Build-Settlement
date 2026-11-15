$ErrorActionPreference = 'Stop'
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6b-prA'
$taskLog = Join-Path $taskRoot 'a3-gates.txt'
$taskUtf8 = New-Object System.Text.UTF8Encoding($false)
$taskHead = (git rev-parse HEAD)
$taskTree = (git rev-parse 'HEAD^{tree}')
if ($taskHead -ne '2a92985e20c5eb0eb0a9faa053bcd73f64410286') { throw 'Final HEAD differs' }
if (git status --porcelain=v1) { throw 'Final head is not clean' }
[IO.File]::WriteAllText($taskLog, "HEAD: $taskHead`nTree: $taskTree`nBase: $(git rev-parse origin/main)`nUTC: $([DateTime]::UtcNow.ToString('o'))`nStatus: empty`n", $taskUtf8)
$taskCpu = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor | Where-Object Name -eq '_Total' | Select-Object Name,PercentProcessorTime
$taskTop = Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin '_Total','Idle' } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 12 Name,IDProcess,PercentProcessorTime
$taskJobs = Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.Name -match '^(node|python|npm|dotnet)(\.exe)?$' -and $_.CommandLine -match '(vitest|playwright[\\/]cli|vite(?:\.js)?[" ]+.*(?:build|preview)|tsc(?:\.js)?[" ]+.*(?:-p|--build)|eslint[\\/]|check-architecture\.mjs|architecture\.test\.mjs)' } | Select-Object Name,ProcessId
[IO.File]::AppendAllText($taskLog, "CPU load at gate start:`n$($taskCpu | Format-Table -AutoSize | Out-String)`nTop current processes (per-process percentages may span multiple logical CPUs):`n$($taskTop | Format-Table -AutoSize | Out-String)`nOther test/build/review job processes: $(@($taskJobs).Count)`n$($taskJobs | Format-Table -AutoSize | Out-String)`n", $taskUtf8)
if ($taskJobs) { throw 'HOLD: another test/build/review process is running; killed nothing' }
$taskResults = [System.Collections.Generic.List[object]]::new()
function Invoke-TaskGate([int]$Number,[string]$Command) {
  $taskStart = [DateTime]::UtcNow
  [IO.File]::AppendAllText($taskLog, "`nGate $Number`nUTC: $($taskStart.ToString('o'))`nCommand: $Command`n", $taskUtf8)
  & $env:ComSpec /d /s /c "$Command >> `"$taskLog`" 2>&1"
  $taskExit = $LASTEXITCODE
  $taskEnd = [DateTime]::UtcNow
  [IO.File]::AppendAllText($taskLog, "`nExit: $taskExit`nUTC end: $($taskEnd.ToString('o'))`nElapsed seconds: $(($taskEnd-$taskStart).TotalSeconds)`n", $taskUtf8)
  $taskResults.Add([pscustomobject]@{gate=$Number;command=$Command;exit=$taskExit;utc=$taskStart.ToString('o');seconds=($taskEnd-$taskStart).TotalSeconds})
  $taskResults | ConvertTo-Json -Depth 8 | ForEach-Object { [IO.File]::WriteAllText((Join-Path $taskRoot 'a3-gate-results.json'), $_ + "`n", $taskUtf8) }
  Write-Output "Gate $Number exit $taskExit ($([Math]::Round(($taskEnd-$taskStart).TotalSeconds,2)) seconds): $Command"
  if ($taskExit -ne 0) { throw "HOLD: gate $Number failed; inspect a3-gates.txt" }
}
Invoke-TaskGate 1 'git diff --check origin/main...HEAD'
Invoke-TaskGate 2 'npm run lint'
Invoke-TaskGate 3 'npm run typecheck'
Invoke-TaskGate 4 'npm run check:architecture'
Invoke-TaskGate 5 'npm run test:architecture'
Invoke-TaskGate 6 'npm test'
Invoke-TaskGate 7 'npm run build'
$taskPorts = Get-NetTCPConnection -LocalPort 4173,4174 -State Listen -ErrorAction SilentlyContinue
[IO.File]::AppendAllText($taskLog, "`nPorts before smoke: $(if ($taskPorts) {'BUSY'} else {'4173/4174 free'})`n", $taskUtf8)
if ($taskPorts) { throw 'HOLD: smoke port occupied; killed nothing' }
$env:CI = '1'
Write-Output "CI=$env:CI"
[IO.File]::AppendAllText($taskLog, "CI=$env:CI`n", $taskUtf8)
Invoke-TaskGate 8 'echo CI=%CI% && npm run test:smoke'
$taskPortsAfter = Get-NetTCPConnection -LocalPort 4173,4174 -State Listen -ErrorAction SilentlyContinue
[IO.File]::AppendAllText($taskLog, "`nPorts after smoke: $(if ($taskPortsAfter) {'BUSY'} else {'4173/4174 free'})`nFinal status:`n$(git status --porcelain=v1)`n", $taskUtf8)
if ($taskPortsAfter) { throw 'HOLD: smoke left a listening port; killed nothing' }
