param([string]$Destination,[int]$ControllerPid)
$ErrorActionPreference='Stop'
$cpu=@(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,NumberOfLogicalProcessors)
$top=@(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin @('_Total','Idle') } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 12 IDProcess,Name,PercentProcessorTime)
$pattern='vitest|playwright|vite[\\/]bin|check-architecture|architecture\.test|tsc[\\/]|svelte-check|run-evidence|review-package|eslint|webpack|jest|pytest|gradle|codex\s+review|profile-harness|run-profile\.py'
$jobs=@(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $ControllerPid -and $_.Name -match '^(node|python|python3|npm|npx|dotnet|java|codex|claude)\.exe$' -and $_.CommandLine -match $pattern } | ForEach-Object { [ordered]@{id=$_.ProcessId;parentId=$_.ParentProcessId;name=$_.Name;job=([regex]::Match($_.CommandLine,$pattern).Value)} })
$ports=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) } | Select-Object LocalAddress,LocalPort,OwningProcess)
[ordered]@{utc=[DateTime]::UtcNow.ToString('o');cpu=$cpu;topProcesses=$top;competingJobs=$jobs;portListeners=$ports} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Destination -Encoding UTF8
if($jobs.Count){Write-Output 'HOLD: competing test, build or review job. Nothing killed.';exit 2}
if($ports.Count){Write-Output 'HOLD: port 4173/4174 held. Nothing killed.';exit 2}
