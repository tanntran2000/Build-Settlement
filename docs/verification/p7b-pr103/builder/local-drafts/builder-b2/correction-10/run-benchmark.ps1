$ErrorActionPreference='Stop'
$c=$PSScriptRoot
$a='f73595b449db84b988d44a44cd33620efca9ecad'
$b='f31310cb791f549a7672be47219c7578678b7058'
$main='C:/Users/Admin/.t3/worktrees/Build-Settlement/b2-c10-benchmark-main'
$expected=[IO.Path]::GetFullPath($main)
if(Test-Path -LiteralPath $main){throw 'Benchmark path exists'}
if((git rev-parse HEAD) -ne $b -or (git rev-parse origin/main) -ne $a -or (git status --porcelain=v1 --untracked-files=all)){throw 'Unexpected product state'}
if(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue){throw 'Both ports must be free'}
$previous=git worktree list --porcelain
$previous | Set-Content -Encoding UTF8 "$c/worktrees-before.txt"
git -c core.autocrlf=false worktree add --detach $main $a
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$start=[DateTime]::UtcNow
$boot=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime
function Snapshot($label){
  $text=@(
    "UTC $([DateTime]::UtcNow.ToString('o'))"
    "Main worktree $expected (detached)"
    "Node executable $((Get-Command node).Source)"
    "Node $(node --version)"
    "Ports 4173 and 4174 free: $(-not (Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue))"
    (Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,LoadPercentage | Format-Table -AutoSize | Out-String)
    'Top processes by cumulative CPU'
    (Get-Process | Sort-Object CPU -Descending | Select-Object -First 12 Name,Id,CPU | Format-Table -AutoSize | Out-String)
    "OS last boot $boot"
  ) -join [char]10
  [IO.File]::WriteAllText("$c/benchmark-environment-$label.txt",$text+[char]10,[Text.UTF8Encoding]::new($false))
}
try {
  if((Resolve-Path -LiteralPath $main).ProviderPath -ne $expected){throw 'Detached worktree path did not resolve as expected'}
  Snapshot 'before'
  python -X utf8 "$c/benchmark-pairs.py" $main
  $benchmarkExit=$LASTEXITCODE
  Snapshot 'after'
  $p1=Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Power-Troubleshooter';Id=1;StartTime=$start.ToLocalTime()} -ErrorAction SilentlyContinue
  $p2=Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=@(42,107);StartTime=$start.ToLocalTime()} -ErrorAction SilentlyContinue
  if($p1 -or $p2){@($p1)+@($p2) | Where-Object {$_} | Select-Object TimeCreated,Id,ProviderName | Out-File -Encoding UTF8 "$c/benchmark-power-events.txt"; $benchmarkExit=3}
  else {"UTC start $($start.ToString('o')) UTC end $([DateTime]::UtcNow.ToString('o'))`nNo matching sleep/resume events" | Set-Content -Encoding UTF8 "$c/benchmark-power-events.txt"}
} finally {
  $resolved=(Resolve-Path -LiteralPath $main).ProviderPath
  if($resolved -ne $expected -or (git -C $resolved rev-parse HEAD) -ne $a -or (git -C $resolved status --porcelain=v1 --untracked-files=all) -or (git -C $resolved branch --show-current)){throw 'Temporary checkout identity or contents changed'}
  git worktree remove $resolved
  if($LASTEXITCODE -ne 0){throw 'Could not remove the temporary detached checkout'}
  if(Test-Path -LiteralPath $main){throw 'Temporary checkout remains'}
  $remaining=git worktree list --porcelain
  $remaining | Set-Content -Encoding UTF8 "$c/worktrees-after.txt"
  if(Compare-Object $previous $remaining){throw 'Worktree inventory changed'}
}
exit $benchmarkExit
