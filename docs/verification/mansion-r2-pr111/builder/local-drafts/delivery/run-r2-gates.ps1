param([string]$Attempt = 'first')
$ErrorActionPreference = 'Stop'
$log = Join-Path $PSScriptRoot "R2.5-$Attempt.txt"
$utf8 = [Text.UTF8Encoding]::new($false)
function Record([string]$value) {
    [IO.File]::AppendAllText($log, $value + [char]10, $utf8)
    Write-Output $value
}
function Utc { [DateTime]::UtcNow.ToString('o') }
function Gate([string]$name, [string]$command) {
    Record "[$(Utc)] $name | $command"
    cmd.exe /d /s /c ($command + ' >> "' + $log + '" 2>&1')
    $code = $LASTEXITCODE
    Record "[$(Utc)] $name exit $code"
    $script:gateCodes[$name] = $code
}
[IO.File]::WriteAllText($log, '', $utf8)
$head = (git rev-parse HEAD).Trim()
$tree = (git rev-parse 'HEAD^{tree}').Trim()
Record "UTC: $(Utc)"
Record "HEAD: $head"
Record "Tree: $tree"
Record "Base: $((git rev-parse origin/main).Trim())"
Record "Branch: $(git branch --show-current)"
Record "Node: $(node --version)"
Record "npm: $(npm.cmd --version)"
if (git status --porcelain) { throw 'A clean worktree is required to record exact-head gate evidence.' }
$listeners = [Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
$ports = @($listeners | Where-Object { $_.Port -in 4173,4174 })
Record "Listener count on ports 4173/4174: $($ports.Count)"
if ($ports.Count -ne 0) { throw 'The required smoke ports are occupied.' }
Add-Type -TypeDefinition @"
using System.Runtime.InteropServices;
public static class MansionR2Awake {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint flags);
}
"@
if ([MansionR2Awake]::SetThreadExecutionState([uint32]2147483649) -eq 0) {
    throw 'Could not enable system keep-awake.'
}
Record 'Windows keep-awake enabled for this gate process.'
$gateCodes = [ordered]@{}
try {
    $cpu = Get-CimInstance -ClassName Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
    Record "Host CPU at start: $($cpu.PercentProcessorTime)%"
    $top = Get-CimInstance -ClassName Win32_PerfFormattedData_PerfProc_Process |
        Where-Object { $_.Name -notin @('_Total','Idle') } |
        Sort-Object PercentProcessorTime -Descending |
        Select-Object -First 10 Name,IDProcess,PercentProcessorTime
    Record ("Top processes at start:" + [char]10 + ($top | Format-Table -AutoSize | Out-String).TrimEnd())
    $env:TERM = 'dumb'
    $env:NO_COLOR = '1'
    Remove-Item Env:FORCE_COLOR -ErrorAction SilentlyContinue
    Gate 'Gate 1' 'git diff --check origin/main...HEAD'
    Gate 'Gate 2' 'npm run lint'
    Gate 'Gate 3' 'npm run typecheck'
    Gate 'Gate 4' 'npm run check:architecture'
    Gate 'Gate 5' 'npm run test:architecture'
    Gate 'Gate 6' 'npm test'
    Gate 'Gate 7' 'npm run build'
    if ($gateCodes['Gate 7'] -eq 0) {
        $env:CI = '1'
        Record "[$(Utc)] CI=1 set in gate shell."
        Gate 'Smoke' 'npm run test:smoke'
    } else {
        Record 'Smoke was blocked by the build failure.'
    }
    if ((git rev-parse HEAD).Trim() -ne $head -or (git rev-parse 'HEAD^{tree}').Trim() -ne $tree -or (git status --porcelain)) {
        throw 'HEAD, tree or tracked worktree changed during the gate run.'
    }
} finally {
    [void][MansionR2Awake]::SetThreadExecutionState([uint32]2147483648)
    Record "[$(Utc)] Windows keep-awake released."
}
if (@($gateCodes.Values | Where-Object { $_ -ne 0 }).Count -gt 0) { exit 1 }
exit 0

