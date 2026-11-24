$ErrorActionPreference='Stop'
$d='C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-11/final'
$head=git rev-parse HEAD
$tree=git rev-parse 'HEAD^{tree}'
$expected='7ac9ad0a15d9d0247879b718d464f0813de149dc'
if($head -ne $expected -or (git status --porcelain=v1 --untracked-files=all)){throw 'Final scope is no longer clean at the verified head'}
if(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue){throw '4173 or 4174 is already occupied'}
$envLines=@(
 "UTC $([DateTime]::UtcNow.ToString('o'))"
 "HEAD $head"
 "Tree $tree"
 "origin/main $(git rev-parse origin/main)"
 "Node $(node --version)"
 "Ports 4173 and 4174 free"
 "CPU and current load"
 (Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,LoadPercentage | Format-Table -AutoSize | Out-String)
 "Top processes by cumulative CPU"
 (Get-Process | Sort-Object CPU -Descending | Select-Object -First 12 Name,Id,CPU | Format-Table -AutoSize | Out-String)
 "OS last boot"
 (Get-CimInstance Win32_OperatingSystem | Select-Object LastBootUpTime | Format-Table -AutoSize | Out-String)
 "Recent sleep/resume records"
 (Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Power-Troubleshooter';Id=1} -MaxEvents 3 -ErrorAction SilentlyContinue | Select-Object TimeCreated,Id,ProviderName | Format-Table -AutoSize | Out-String)
 (Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=@(42,107)} -MaxEvents 4 -ErrorAction SilentlyContinue | Select-Object TimeCreated,Id,ProviderName | Format-Table -AutoSize | Out-String)
) -join [char]10
[IO.File]::WriteAllText("$d/b2-3-environment-before.txt",$envLines+[char]10,[Text.UTF8Encoding]::new($false))
$commands=@(
 @('git','diff','--check','origin/main...HEAD'),
 @('npm','run','lint'),
 @('npm','run','typecheck'),
 @('npm','run','check:architecture'),
 @('npm','run','test:architecture'),
 @('npm','test'),
 @('npm','run','build')
)
$exits=@()
for($i=0;$i -lt $commands.Length;$i++){
 $gate=$i+1
 if((git rev-parse HEAD) -ne $expected -or (git status --porcelain=v1 --untracked-files=all)){throw "Final scope changed before gate $gate"}
 $arguments = $commands[$i]
 python -X utf8 "C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/run-evidence.py" "correction-11/final/b2-3-gate-$gate" @arguments
 $exits += $LASTEXITCODE
}
$summary=@{head=$head;tree=$tree;exits=$exits;commands=@($commands | ForEach-Object {$_ -join ' '})} | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText("$d/b2-3-gates.json",$summary+[char]10,[Text.UTF8Encoding]::new($false))
if($exits | Where-Object {$_ -ne 0}){exit 1}
exit 0
