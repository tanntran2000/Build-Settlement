param([string]$Attempt = 'first')
$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot "perf-$Attempt-environment.txt"
$utf8=[Text.UTF8Encoding]::new($false)
function Add-Record([string]$text) {
    [IO.File]::AppendAllText($envPath,$text+[char]10,$utf8)
    Write-Output $text
}
function Cpu-Sample([string]$label) {
    $cpu=Get-CimInstance -ClassName Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
    Add-Record "$label CPU: $($cpu.PercentProcessorTime)%"
    $top=Get-CimInstance -ClassName Win32_PerfFormattedData_PerfProc_Process |
        Where-Object { $_.Name -notin @('_Total','Idle') } |
        Sort-Object PercentProcessorTime -Descending |
        Select-Object -First 10 Name,IDProcess,PercentProcessorTime
    Add-Record ($top | Format-Table -AutoSize | Out-String)
}
[IO.File]::WriteAllText($envPath,'',$utf8)
$root=(git rev-parse --show-toplevel).Trim()
$base='13cf5b165c36872d1ac216e4a8a161b79f3fb7c5'
$head=(git rev-parse HEAD).Trim()
$tree=(git write-tree).Trim()
if (git status --porcelain) { throw 'Profile requires a clean working tree.' }
$path=Join-Path ([IO.Path]::GetTempPath()) ("mansion-r2-base-"+[guid]::NewGuid().ToString('N'))
[IO.Directory]::CreateDirectory($path) | Out-Null
$archive=Join-Path $path 'base.tar'
$source=Join-Path $path 'src'
[IO.Directory]::CreateDirectory($source) | Out-Null
git archive --format=tar --output=$archive $base packages/core/src packages/simulation/src packages/persistence/src packages/content/src
if ($LASTEXITCODE -ne 0) { throw 'Base archive failed.' }
tar.exe -xf $archive -C $source
if ($LASTEXITCODE -ne 0) { throw 'Base archive extraction failed.' }
Add-Record "UTC: $([DateTime]::UtcNow.ToString('o'))"
Add-Record "Base: $base ($((git rev-parse "$base^{tree}").Trim()))"
Add-Record "Base archive SHA-256: $((Get-FileHash -LiteralPath $archive).Hash.ToLowerInvariant())"
Add-Record "Base snapshot source: $source"
Add-Record "Parent commit: $head"
Add-Record "Head tree: $tree"
Add-Record "Node: $(node --version)"
Add-Record "CPU model: $((Get-CimInstance Win32_Processor).Name)"
$listeners=@([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object Port -in 4173,4174)
Add-Record "Listener count on ports 4173/4174: $($listeners.Count)"
if ($listeners.Count) { throw 'Smoke listeners are still active.' }
if (-not ('MansionR2MeasureAwake' -as [type])) {
    Add-Type -TypeDefinition @"
using System.Runtime.InteropServices;
public static class MansionR2MeasureAwake {
    [DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags);
}
"@
}
if ([MansionR2MeasureAwake]::SetThreadExecutionState([uint32]2147483649) -eq 0) { throw 'Could not enable keep-awake.' }
try {
    Add-Record 'Keep-awake enabled.'
    Cpu-Sample 'Before'
    $measure=Join-Path $PSScriptRoot 'profile-end-week.mjs'
    $fixture=Join-Path (Split-Path -Parent $PSScriptRoot) 'perf-exact-head'
    $output=Join-Path $PSScriptRoot "run-$Attempt"
    $digest=(Get-FileHash -LiteralPath $measure).Hash.ToLowerInvariant()
    Add-Record "Pre-run script SHA-256: $digest"
    Add-Record "node $measure $source $root $fixture $output"
    node $measure $source $root $fixture $output
    $code=$LASTEXITCODE
    Add-Record "CPU profile exit: $code"
    if ($code -eq 0) {
        Add-Record "node $measure $source $root $fixture $output --audit"
        node $measure $source $root $fixture $output --audit
        $code=$LASTEXITCODE
        Add-Record "Branch audit exit: $code"
    }
    Cpu-Sample 'After'
    if ($head -ne (git rev-parse HEAD).Trim() -or $tree -ne (git write-tree).Trim() -or (git diff --name-only)) { throw 'Candidate changed while timing.' }
} finally {
    [void][MansionR2MeasureAwake]::SetThreadExecutionState([uint32]2147483648)
    Add-Record "Keep-awake released at $([DateTime]::UtcNow.ToString('o'))."
}
exit $code

