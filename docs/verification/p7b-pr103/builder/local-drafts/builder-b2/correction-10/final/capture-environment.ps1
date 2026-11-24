$ErrorActionPreference='Stop'
$d='C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/final'
$label=$args[0]
if($label -notin @('before-smoke','after')){throw 'Unknown environment capture label'}
$head=git rev-parse HEAD
$tree=git rev-parse 'HEAD^{tree}'
$status=git status --porcelain=v1 --untracked-files=all
$ports=Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue
$first=Get-Content -Encoding UTF8 "$d/b2-3-environment-before.txt" -TotalCount 1
$start=[DateTimeOffset]::Parse($first.Substring(4)).LocalDateTime
$systemPowerTroubleshooter=Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Power-Troubleshooter';Id=1;StartTime=$start} -ErrorAction SilentlyContinue
$systemKernelPower=Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=@(42,107);StartTime=$start} -ErrorAction SilentlyContinue
$lines=@(
 "UTC $([DateTime]::UtcNow.ToString('o'))"
 "HEAD $head"
 "Tree $tree"
 "Branch $(git branch --show-current)"
 "origin/main $(git rev-parse origin/main)"
 "Git status --porcelain=v1 --untracked-files=all output"
 $(if($status){$status}else{'<empty>'})
 $(if($ports){$ports | Select-Object LocalPort,OwningProcess | Format-Table -AutoSize | Out-String}else{'Ports 4173 and 4174 free'})
 "CPU and current load"
 (Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,LoadPercentage | Format-Table -AutoSize | Out-String)
 "Top processes by cumulative CPU"
 (Get-Process | Sort-Object CPU -Descending | Select-Object -First 12 Name,Id,CPU | Format-Table -AutoSize | Out-String)
 "OS last boot"
 (Get-CimInstance Win32_OperatingSystem | Select-Object LastBootUpTime | Format-Table -AutoSize | Out-String)
 "Sleep/resume System events since pre-gates environment capture ($($start.ToString('o')) local time)"
 $(if($systemPowerTroubleshooter -or $systemKernelPower){@($systemPowerTroubleshooter)+@($systemKernelPower) | Where-Object { $_ } | Select-Object TimeCreated,Id,ProviderName | Format-Table -AutoSize | Out-String}else{'No matching events'})
 "Commits"
 (git log -3 '--format=%H %T %s%n%b' | Out-String)
)
[IO.File]::WriteAllText("$d/b2-3-environment-$label.txt",($lines -join [char]10)+[char]10,[Text.UTF8Encoding]::new($false))
$lines
if($ports -or $status -or $head -ne '63cbdca96fc7a326d2d1204c0b0871dc34a6d14e' -or $tree -ne '312797f184f6414064e5ecf81eb1fba7a7bc55d0'){exit 1}
