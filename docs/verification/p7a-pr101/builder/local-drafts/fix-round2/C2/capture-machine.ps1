param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
$started = [DateTime]::UtcNow.ToString('o')
$ports = @([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
    Where-Object { $_.Port -in @(4173, 4174) } |
    Select-Object @{Name='localAddress'; Expression={$_.Address.ToString()}}, @{Name='localPort'; Expression={$_.Port}})
$processes = @(Get-CimInstance Win32_Process)
$patterns = [ordered]@{
    test = '(?i)\b(vitest|playwright|cypress|jest|pytest|mocha|test:smoke|test:architecture|architecture\.test\.mjs)\b|\b(node|dotnet)(\.exe)?["'']?\s+(--test|test)\b|\b(npm|pnpm|yarn)(-cli\.js|\.cmd)?["'']?\s+(run\s+)?test\b'
    build = '(?i)\b(svelte-check|eslint|tsc\.js|check:architecture|check-architecture\.mjs|typecheck|webpack|gradle|msbuild|build:regression)\b|\b(vite|tsc)(\.js|\.cmd)?["'']?\s+build\b|\b(npm|pnpm|yarn)(-cli\.js|\.cmd)?["'']?\s+(run\s+)?build\b|\bvite[\\/]bin[\\/]vite\.js'
    review = '(?i)\b(codex(\.exe)?["'']?\s+review|run-evidence|review-package|verify-edit-inventory|analyze-profile\.py)\b'
    benchmark = '(?i)\b(profile-harness\.mjs|run-profile\.py|measure-npc-life\.mjs)\b|[\\/]cold-start[\\/]harness\.mjs\b'
}
$jobProcesses = @($processes | Where-Object {
    $_.Name -match '^(node|npm|npx|pnpm|yarn|python|python3|py|java|dotnet|msbuild|codex|claude|powershell|pwsh|cmd|bash|vite|vitest|playwright|eslint|tsc|pytest|gradle)\.exe$'
})
$jobs = @(foreach ($process in $jobProcesses) {
    $matched = @($patterns.Keys | Where-Object { $process.CommandLine -match $patterns[$_] })
    if ($matched.Count) {
        [ordered]@{ pid = $process.ProcessId; parentPid = $process.ParentProcessId; name = $process.Name; categories = $matched }
    }
})
$cpu = @(Get-CimInstance Win32_Processor |
    Select-Object LoadPercentage, NumberOfLogicalProcessors)
$top = @(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process |
    Where-Object { $_.Name -notin @('_Total', 'Idle') } |
    Sort-Object PercentProcessorTime -Descending |
    Select-Object -First 12 IDProcess, Name, PercentProcessorTime)
$result = [ordered]@{
    captureStartUtc = $started
    utc = [DateTime]::UtcNow.ToString('o')
    cpu = $cpu
    topProcesses = $top
    processCpuUnit = 'PercentProcessorTime, 100 per fully busy logical CPU'
    processScanCount = $processes.Count
    commandLineReadableCount = @($jobProcesses | Where-Object { $_.CommandLine }).Count
    candidateJobProcessCount = $jobProcesses.Count
    competingJobs = $jobs
    portListeners = $ports
}
$json = $result | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($Destination, $json + [char]10, (New-Object System.Text.UTF8Encoding($false)))
if ($jobs.Count -or $ports.Count) { exit 2 }
