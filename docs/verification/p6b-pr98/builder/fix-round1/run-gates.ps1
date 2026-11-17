param([Parameter(Mandatory=$true)][string]$ExpectedHead)
$ErrorActionPreference='Stop'
$repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01'
$evidence='C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1'
$base='43fcb9b856c66606230d6d7ba49140ae94cfaa00'
$utf8=[Text.UTF8Encoding]::new($false)
Set-Location -LiteralPath $repo
if((git rev-parse HEAD) -ne $ExpectedHead -or (git status --porcelain=v1)){throw 'HOLD: final head/status differs'}
if((git rev-parse origin/main) -ne $base){throw 'HOLD: origin/main differs from the approved base'}
$tree=git rev-parse 'HEAD^{tree}'
$busy=@(Get-CimInstance Win32_Process | Where-Object {$_.Name -eq 'node.exe' -and $_.CommandLine -match 'vitest[\\/]vitest|vitest\.mjs|tinypool|playwright[\\/].*cli|typescript[\\/].*tsc|vite[\\/].*vite\.js.*build|npm-cli\.js"?\s+(test|run\s+(build|test))'})
$cpu=Get-CimInstance Win32_Processor | Select-Object Name,LoadPercentage,NumberOfLogicalProcessors
$top=Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Id,ProcessName,CPU,WorkingSet64
$now=Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object {$_.Name -notin @('Idle','_Total')} | Sort-Object PercentProcessorTime -Descending | Select-Object -First 10 Name,IDProcess,PercentProcessorTime,WorkingSet
$quiet='UTC_SNAPSHOT: '+[DateTime]::UtcNow.ToString('o')+"`nHEAD: $ExpectedHead`nTREE: $tree`nCPU LOAD:`n"+($cpu|Format-Table -AutoSize|Out-String)+"TOP PROCESSES (cumulative CPU seconds):`n"+($top|Format-Table -AutoSize|Out-String)+"CURRENT PROCESS CPU COUNTERS (raw per-process, can span cores):`n"+($now|Format-Table -AutoSize|Out-String)+"OTHER TEST/BUILD JOBS:`n"+($busy|Select-Object ProcessId,Name,CommandLine|Format-Table -Wrap|Out-String)+"REVIEW: no delegated/background review job launched by this Builder. Claude/Astra review is pending handoff.`n"
[IO.File]::WriteAllText((Join-Path $evidence 'c3-quiet-machine.txt'),$quiet,$utf8)
if($busy.Count){throw 'HOLD: another test/build job is running; kill nothing'}
$script:results=[Collections.Generic.List[object]]::new()
function Invoke-Gate([string]$Name,[string]$Executable,[string[]]$CommandArgs){
  $path=Join-Path $evidence ($Name+'.txt')
  $writer=[IO.StreamWriter]::new($path,$false,$utf8)
  $start=[DateTime]::UtcNow
  $writer.WriteLine('EXIT: PENDING')
  $writer.WriteLine($quiet)
  $writer.WriteLine('UTC_START: '+$start.ToString('o'))
  $writer.WriteLine('COMMAND: '+$Executable+' '+($CommandArgs -join ' '))
  $writer.WriteLine('CI='+$env:CI)
  $writer.Flush()
  Write-Output ('START '+$Name+' '+$start.ToString('o'))
  $savedPreference=$ErrorActionPreference
  $ErrorActionPreference='Continue'
  & $Executable @CommandArgs 2>&1 | ForEach-Object {$writer.WriteLine([string]$_);$writer.Flush();Write-Output ([string]$_)}
  $code=$LASTEXITCODE
  $ErrorActionPreference=$savedPreference
  $end=[DateTime]::UtcNow
  $writer.WriteLine('UTC_END: '+$end.ToString('o'))
  $writer.WriteLine('EXIT: '+$code)
  $writer.Dispose()
  $content=[IO.File]::ReadAllText($path,$utf8).Replace('EXIT: PENDING','EXIT: '+$code)
  [IO.File]::WriteAllText($path,$content,$utf8)
  $script:results.Add([ordered]@{name=$Name;command=$Executable+' '+($CommandArgs -join ' ');head=$ExpectedHead;tree=$tree;startUtc=$start.ToString('o');endUtc=$end.ToString('o');exit=$code;seconds=[Math]::Round(($end-$start).TotalSeconds,3)})
  [IO.File]::WriteAllText((Join-Path $evidence 'c3-results.json'),($script:results|ConvertTo-Json -Depth 5)+"`n",$utf8)
  if($code -ne 0){throw ('HOLD: '+$Name+' exit '+$code)}
  if((git rev-parse HEAD) -ne $ExpectedHead -or (git status --porcelain=v1)){throw ('HOLD: head/status changed after '+$Name)}
  Write-Output ('PASS '+$Name+' '+($end-$start).TotalSeconds+'s')
}
Invoke-Gate 'gate1-diff-check' 'git' @('diff','--check','origin/main...HEAD')
Invoke-Gate 'gate2-lint' 'npm.cmd' @('run','lint')
Invoke-Gate 'gate3-typecheck' 'npm.cmd' @('run','typecheck')
Invoke-Gate 'gate4-check-architecture' 'npm.cmd' @('run','check:architecture')
Invoke-Gate 'gate5-test-architecture' 'npm.cmd' @('run','test:architecture')
Invoke-Gate 'gate6-unit' 'npm.cmd' @('test')
Invoke-Gate 'gate7-build' 'npm.cmd' @('run','build')
$ports=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -in @(4173,4174)})
[IO.File]::WriteAllText((Join-Path $evidence 'c3-pre-smoke-ports.txt'),'UTC: '+[DateTime]::UtcNow.ToString('o')+"`nHEAD: $ExpectedHead`n"+($ports|Format-Table LocalAddress,LocalPort,OwningProcess|Out-String)+$(if($ports.Count){'OCCUPIED - HOLD'}else{'4173/4174 FREE'})+"`n",$utf8)
if($ports.Count){throw 'HOLD: port occupied before smoke; kill nothing'}
Invoke-Gate 'c3-legacy-before' 'node' @('C:/Users/Admin/.t3/local-drafts/p6b-prC/preserve-legacy-e2e-artifacts.mjs','before','fix-round1-full-smoke')
echo "CI=$env:CI"
[IO.File]::WriteAllText((Join-Path $evidence 'c3-ci-environment.txt'),'UTC: '+[DateTime]::UtcNow.ToString('o')+"`nCOMMAND: echo CI before setting`nCI="+$env:CI+"`n",$utf8)
$env:CI='1'
echo "CI=$env:CI"
[IO.File]::AppendAllText((Join-Path $evidence 'c3-ci-environment.txt'),"COMMAND: CI=1 npm run test:smoke`nCI=$env:CI`n",$utf8)
try { Invoke-Gate 'c3-smoke-ci1' 'npm.cmd' @('run','test:smoke') }
finally { Invoke-Gate 'c3-legacy-after' 'node' @('C:/Users/Admin/.t3/local-drafts/p6b-prC/preserve-legacy-e2e-artifacts.mjs','after','fix-round1-full-smoke') }
$afterPorts=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -in @(4173,4174)})
if($afterPorts.Count){throw 'HOLD: ports remain occupied after smoke; kill nothing'}
[IO.File]::WriteAllText((Join-Path $evidence 'c3-final-ports.txt'),'UTC: '+[DateTime]::UtcNow.ToString('o')+"`nHEAD: $ExpectedHead`n4173/4174 FREE`nEXIT: 0`n",$utf8)
Invoke-Gate 'bundle-measurement' 'node' @('C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round1/measure-bundle.mjs')
Invoke-Gate 'c3-final-inventory-immutable' 'node' @('C:/Users/Admin/.t3/local-drafts/p6b-prC/verify-edit-inventory.mjs','--mode','final','--approval','C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json')
Write-Output 'C3 gates, CI=1 smoke, bundle and immutable verification finished; ports free.'
