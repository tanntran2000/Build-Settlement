param([string]$Evidence)
$ErrorActionPreference = 'Stop'
$env:NO_COLOR = $null
$env:FORCE_COLOR = '0'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$head = (git rev-parse HEAD).Trim()
$tree = (git rev-parse 'HEAD^{tree}').Trim()
$runStart = Get-Date
$result = [Collections.Generic.List[object]]::new()
$summary = Join-Path $Evidence 'gate-summary.json'
function Assert-PinnedHead {
    if ((git rev-parse HEAD).Trim() -cne $head -or (git rev-parse 'HEAD^{tree}').Trim() -cne $tree -or (git status --porcelain=v1)) {
        throw 'The build no longer has the clean pinned HEAD.'
    }
}
function Assert-PortsFree {
    $listeners = Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 4173,4174 }
    if ($listeners) { throw 'Expected free ports 4173 and 4174.' }
}
function Save-Summary {
    $value=[ordered]@{ head=$head; tree=$tree; startedUtc=$runStart.ToUniversalTime().ToString('o'); gates=$result.ToArray() }
    [IO.File]::WriteAllText($summary,($value | ConvertTo-Json -Depth 6)+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
}
function Record-SleepEvents([DateTime]$Start, [string]$Path) {
    try {
        Get-WinEvent -FilterHashtable @{LogName='System'; Id=1,42,107; StartTime=$Start} -ErrorAction Stop |
          Where-Object ProviderName -in @('Microsoft-Windows-Kernel-Power','Microsoft-Windows-Power-Troubleshooter') |
          Select-Object @{Name='Utc';Expression={$_.TimeCreated.ToUniversalTime().ToString('o')}},Id,ProviderName |
          Format-Table -AutoSize | Out-File -Append -Encoding utf8 -LiteralPath $Path
    } catch {
        if ($_.FullyQualifiedErrorId -notlike 'NoMatchingEventsFound*') { throw }
        'No matching sleep/resume events.' | Out-File -Append -Encoding utf8 -LiteralPath $Path
    }
}
function Run-Check([string]$Name,[string]$Command,[string]$Echo) {
    Assert-PinnedHead
    $log = Join-Path $Evidence ($Name + '.txt')
    $start=[DateTime]::UtcNow
    @("HEAD $head","Tree $tree","Start UTC $($start.ToString('o'))","Command: $Command") | Out-File -Encoding utf8 -LiteralPath $log
    if ($Echo) { $Echo | Out-File -Append -Encoding utf8 -LiteralPath $log }
    & cmd.exe /d /s /c ($Command+' 2>&1') | Out-File -Append -Encoding utf8 -LiteralPath $log
    $code=$LASTEXITCODE
    $end=[DateTime]::UtcNow
    @("End UTC $($end.ToString('o'))","Exit code: $code") | Out-File -Append -Encoding utf8 -LiteralPath $log
    $result.Add([ordered]@{ id=$Name; command=$Command; exitCode=$code; startUtc=$start.ToString('o'); endUtc=$end.ToString('o'); log=$log })
    Save-Summary
    Write-Output "$Name exit $code"
    return $code
}
Assert-PinnedHead
Assert-PortsFree
$machine=Join-Path $Evidence 'quiet-machine.txt'
@("UTC $([DateTime]::UtcNow.ToString('o'))","HEAD $head","Tree $tree","Ports 4173 and 4174 free.","CPU samples:") | Out-File -Encoding utf8 -LiteralPath $machine
Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3 |
  ForEach-Object { $_.CounterSamples | Select-Object Timestamp, CookedValue } |
  Format-Table -AutoSize | Out-File -Append -Encoding utf8 -LiteralPath $machine
'Top processes by total CPU seconds:' | Out-File -Append -Encoding utf8 -LiteralPath $machine
Get-Process | Sort-Object CPU -Descending | Select-Object -First 12 ProcessName,Id,CPU |
  Format-Table -AutoSize | Out-File -Append -Encoding utf8 -LiteralPath $machine
'Last wake:' | Out-File -Append -Encoding utf8 -LiteralPath $machine
powercfg /lastwake | Out-File -Append -Encoding utf8 -LiteralPath $machine
'Sleep/resume record for the preceding 12 hours:' | Out-File -Append -Encoding utf8 -LiteralPath $machine
Record-SleepEvents $runStart.AddHours(-12) $machine
try {
  foreach($check in @(
    @('gate-1-diff','git diff --check origin/main...HEAD'),
    @('gate-2-lint','npm run lint'),
    @('gate-3-typecheck','npm run typecheck'),
    @('gate-4-architecture','npm run check:architecture'),
    @('gate-5-architecture-tests','npm run test:architecture'),
    @('gate-6-unit','npm test'),
    @('gate-7-build','npm run build')
  )) {
      $code=Run-Check $check[0] $check[1] ''
      if (@($code)[-1] -ne 0) { exit @($code)[-1] }
  }
  $code=Run-Check 'smoke-build-regression' 'npm run build:regression --workspace=@haven/ui' ''
  if (@($code)[-1] -ne 0) { exit @($code)[-1] }
  Assert-PortsFree
  $checkScript=Join-Path $Evidence 'verify-served-build.mjs'
  $hashResult=Join-Path $Evidence 'served-build-sha256.json'
  $hashCommand='node "'+$checkScript+'" "'+$hashResult+'"'
  $code=Run-Check 'served-build-check' $hashCommand ''
  if (@($code)[-1] -ne 0) { exit @($code)[-1] }
  Assert-PortsFree
  $CI='1'
  $env:CI=$CI
  $statement=echo "CI=$CI"
  $code=Run-Check 'smoke-full' 'npm run test:smoke' $statement
  Assert-PortsFree
  Assert-PinnedHead
  exit @($code)[-1]
} finally {
  'Sleep/resume during this run:' | Out-File -Append -Encoding utf8 -LiteralPath $machine
  Record-SleepEvents $runStart $machine
  Save-Summary
}
