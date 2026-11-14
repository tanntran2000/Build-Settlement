param([Parameter(Mandatory=$true)][string]$EvidenceStem)
$ErrorActionPreference = 'Stop'
if ($EvidenceStem -notmatch '^[a-z0-9-]+$') { throw 'Invalid evidence stem' }
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6a-prC'
$logicalCount = [Environment]::ProcessorCount
$started = [DateTime]::UtcNow
$first = @{}
Get-Process | ForEach-Object { try { $first[$_.Id] = $_.TotalProcessorTime.TotalMilliseconds } catch {} }
$samples = @()
1..5 | ForEach-Object {
  $cpu = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
  $samples += @{ UTC=[DateTime]::UtcNow.ToString('o'); totalPercent=[double]$cpu.PercentProcessorTime }
  Start-Sleep -Seconds 1
}
$elapsed = ([DateTime]::UtcNow - $started).TotalMilliseconds
$allProcesses = @(Get-Process | ForEach-Object {
  try {
    if ($first.ContainsKey($_.Id)) {
      [PSCustomObject]@{ process=$_.ProcessName; pid=$_.Id; cpuPercent=[Math]::Round(100 * ($_.TotalProcessorTime.TotalMilliseconds - $first[$_.Id]) / $elapsed / $logicalCount, 3); workingSetMB=[Math]::Round($_.WorkingSet64 / 1MB, 1) }
    }
  } catch {}
} | Sort-Object cpuPercent -Descending)
$knownJobs = @(Get-CimInstance Win32_Process | Where-Object {
  $_.ProcessId -ne $PID -and $_.Name -match '^(node|python|python3|dotnet|MSBuild|cl|cargo|rustc|java|javac)\.exe$' -and $_.CommandLine -match '(?i)(vitest|playwright|[\\/]tsc(?:\.js)?\b|[\\/]vite(?:\.js)?\b.*\bbuild\b|msbuild|cargo.*(?:build|test)|pytest|gradle)'
} | ForEach-Object { [PSCustomObject]@{ pid=$_.ProcessId; parentPid=$_.ParentProcessId; process=$_.Name; classification='Other build/test job detected; full command line omitted' } })
$agents = @($allProcesses | Where-Object { $_.process -match '^(claude|codex)$' })
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
$average = [Math]::Round(($samples | ForEach-Object { $_.totalPercent } | Measure-Object -Average).Average, 2)
$busyAgents = @($agents | Where-Object { $_.cpuPercent -gt 2 })
$quiet = $knownJobs.Count -eq 0 -and $listeners.Count -eq 0 -and $average -le 15 -and $busyAgents.Count -eq 0
$result = @{ HEAD=(git rev-parse HEAD); tree=(git rev-parse 'HEAD^{tree}'); UTC=$started.ToString('o'); finishedUTC=[DateTime]::UtcNow.ToString('o'); exit=0; logicalProcessors=$logicalCount; sampledMilliseconds=$elapsed; cpuSamples=$samples; averageCpuPercent=$average; topProcesses=@($allProcesses | Select-Object -First 12); agentProcesses=$agents; ownerReportedClaudeAndAstraIdle=$true; knownHeavyJobs=$knownJobs; listeners=$listeners; quiet=$quiet; operationalQuietCheck='No other detected build/test job or listener; mean total CPU <=15%; agent CPU deltas <=2%. This is a scheduling check, not a test/configuration threshold change.'; method='Five CPU samples with one-second pauses; process CPU-time deltas normalized by logical processor count. No process stopped.' }
$result | ConvertTo-Json -Depth 8 | Out-File -Encoding utf8 "$taskRoot/fix1/$EvidenceStem.json"
$result | ConvertTo-Json -Depth 8
