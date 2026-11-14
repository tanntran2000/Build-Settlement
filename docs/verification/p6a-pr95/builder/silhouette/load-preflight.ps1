param([string]$EvidenceStem = 'load-preflight')
$ErrorActionPreference = 'Stop'
if ($EvidenceStem -notmatch '^[a-z0-9-]+$') { throw 'Invalid evidence stem' }
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6a-prC'
$logicalCount = [Environment]::ProcessorCount
$started = [DateTime]::UtcNow
$first = @{}
Get-Process | ForEach-Object { try { $first[$_.Id] = $_.TotalProcessorTime.TotalMilliseconds } catch {} }
$cpuSamples = @()
1..5 | ForEach-Object {
  $cpu = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
  $cpuSamples += @{ UTC=[DateTime]::UtcNow.ToString('o'); totalPercent=[double]$cpu.PercentProcessorTime }
  Start-Sleep -Seconds 1
}
$elapsed = ([DateTime]::UtcNow - $started).TotalMilliseconds
$processSamples = @(Get-Process | ForEach-Object {
  try {
    if ($first.ContainsKey($_.Id)) {
      $used = $_.TotalProcessorTime.TotalMilliseconds - $first[$_.Id]
      [PSCustomObject]@{ process=$_.ProcessName; pid=$_.Id; cpuPercent=[Math]::Round(100 * $used / $elapsed / $logicalCount, 3); workingSetMB=[Math]::Round($_.WorkingSet64 / 1MB, 1) }
    }
  } catch {}
} | Sort-Object cpuPercent -Descending | Select-Object -First 12)
$knownJobs = @(Get-CimInstance Win32_Process | Where-Object {
  $_.ProcessId -ne $PID -and $_.Name -match '^(node|python|python3|dotnet|MSBuild|cl|cargo|rustc|java|javac)\.exe$' -and $_.CommandLine -match '(?i)(vitest|playwright|[\\/]tsc(?:\s|\.js)|vite(?:\.js)?\s+build|msbuild|cargo\s+(build|test)|pytest|gradle)'
} | ForEach-Object { [PSCustomObject]@{ pid=$_.ProcessId; parentPid=$_.ParentProcessId; process=$_.Name; classification='other build/test job detected; command line omitted' } })
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
$result = @{ HEAD=(git rev-parse HEAD); tree=(git rev-parse 'HEAD^{tree}'); UTC=$started.ToString('o'); finishedUTC=[DateTime]::UtcNow.ToString('o'); exit=0; logicalProcessors=$logicalCount; sampledMilliseconds=$elapsed; cpuSamples=$cpuSamples; topProcesses=$processSamples; knownHeavyJobs=$knownJobs; listeners=$listeners; method='Five one-second total CPU samples; top processes use CPU-time deltas normalized by logical processor count. No process stopped.' }
if ($knownJobs.Count -or $listeners.Count) { $result.exit=1 }
$result | ConvertTo-Json -Depth 8 | Out-File -Encoding utf8 "$taskRoot/silhouette/$EvidenceStem.json"
$result | ConvertTo-Json -Depth 8
if ($result.exit) { throw 'HOLD: another build/test job or occupied port detected; nothing stopped' }
