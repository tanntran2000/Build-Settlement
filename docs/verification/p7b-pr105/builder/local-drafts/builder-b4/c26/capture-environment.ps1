param(
  [Parameter(Mandatory=$true)][string]$Label,
  [string]$Since
)
$ErrorActionPreference='Stop'
$output=Join-Path $PSScriptRoot ("environment-$Label.txt")
$head=git rev-parse HEAD
$tree=git rev-parse 'HEAD^{tree}'
$status=git status --porcelain=v1 --untracked-files=all
$ports=Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue
$start=if($Since){[DateTimeOffset]::Parse($Since).LocalDateTime}else{(Get-Date).AddDays(-7)}
$power=Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Power-Troubleshooter';Id=1;StartTime=$start} -ErrorAction SilentlyContinue
$kernel=Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=@(42,107);StartTime=$start} -ErrorAction SilentlyContinue
$first=@{}; Get-Process | ForEach-Object { $first[$_.Id] = $_.CPU }
Start-Sleep -Seconds 2
$top=Get-Process | Where-Object { $first.ContainsKey($_.Id) } | Select-Object Name,Id,@{Name='CPUSecondsOverSample';Expression={[Math]::Round($_.CPU-$first[$_.Id],3)}} |
  Sort-Object CPUSecondsOverSample -Descending | Select-Object -First 12 | Format-Table -AutoSize | Out-String
$lines=@(
  "UTC $([DateTime]::UtcNow.ToString('o'))"
  "HEAD $head"
  "Tree $tree"
  "Branch $(git branch --show-current)"
  "origin/main $(git rev-parse origin/main)"
  "Node $(node --version)"
  $(if($status){$status}else{'Git status empty'})
  $(if($ports){$ports | Format-Table -AutoSize | Out-String}else{'Ports 4173 and 4174 free'})
  'CPU current load'
  (Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,LoadPercentage | Format-Table -AutoSize | Out-String)
  'Top processes by sampled CPU seconds'
  $top
  'System last boot'
  (Get-CimInstance Win32_OperatingSystem | Select-Object LastBootUpTime | Format-Table -AutoSize | Out-String)
  "Sleep/resume System records since $($start.ToString('o'))"
  $(if($power -or $kernel){@($power)+@($kernel) | Where-Object {$_} | Select-Object TimeCreated,Id,ProviderName |
    Format-Table -AutoSize | Out-String}else{'No matching events'})
)
[IO.File]::WriteAllText($output,($lines -join [char]10)+[char]10,[Text.UTF8Encoding]::new($false))
$lines
if($ports -or $status){exit 1}
