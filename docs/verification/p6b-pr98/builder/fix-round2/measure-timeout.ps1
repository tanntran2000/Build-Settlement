$ErrorActionPreference='Stop'
$repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01'
$out='C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2'
$utf8=[Text.UTF8Encoding]::new($false)
Set-Location -LiteralPath $repo
$results=@()
for($run=1;$run -le 3;$run++){
  $busy=@(Get-CimInstance Win32_Process | Where-Object {$_.Name -eq 'node.exe' -and $_.CommandLine -match 'vitest[\\/]vitest|vitest\.mjs|tinypool|playwright[\\/].*cli|typescript[\\/].*tsc|vite[\\/].*vite\.js.*build|npm-cli\.js"?\s+(test|run\s+(build|test))'})
  if($busy.Count){throw 'Another test/build job is running. Kill nothing.'}
  $cpu=Get-CimInstance Win32_Processor | Select-Object Name,LoadPercentage,NumberOfLogicalProcessors
  $top=Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object {$_.Name -notin @('Idle','_Total')} | Sort-Object PercentProcessorTime -Descending | Select-Object -First 10 Name,IDProcess,PercentProcessorTime,WorkingSet
  $start=[DateTime]::UtcNow
  $path=Join-Path $out ('timeout-alone-'+$run+'.txt')
  $writer=[IO.StreamWriter]::new($path,$false,$utf8)
  $writer.WriteLine('HEAD: '+(git rev-parse HEAD))
  $writer.WriteLine('COMMITTED_TREE: '+(git rev-parse 'HEAD^{tree}'))
  $writer.WriteLine('STATUS: uncommitted round-2 extraction; exact patch preserved in evidence')
  $writer.WriteLine('CPU AT START:')
  $writer.WriteLine(($cpu|Format-Table -AutoSize|Out-String))
  $writer.WriteLine('TOP PROCESSES:')
  $writer.WriteLine(($top|Format-Table -AutoSize|Out-String))
  $writer.WriteLine('COMPETING TEST/BUILD JOBS: none detected')
  $writer.WriteLine('UTC_START: '+$start.ToString('o'))
  $argsList=@('vitest','run','packages/simulation/src/__tests__/society-renewable-support.test.ts','-t','preserves complete gameplay and assignments through sixty weeks of snapshot restores','--reporter=verbose')
  $writer.WriteLine('COMMAND: npx '+($argsList -join ' '))
  $writer.Flush()
  Write-Output ('START measurement '+$run)
  $ErrorActionPreference='Continue'
  & npx.cmd @argsList 2>&1 | ForEach-Object {$writer.WriteLine([string]$_);$writer.Flush()}
  $code=$LASTEXITCODE
  $ErrorActionPreference='Stop'
  $end=[DateTime]::UtcNow
  $writer.WriteLine('UTC_END: '+$end.ToString('o'))
  $writer.WriteLine('WALL_SECONDS: '+($end-$start).TotalSeconds)
  $writer.WriteLine('EXIT: '+$code)
  $writer.Dispose()
  $content=[IO.File]::ReadAllText($path,$utf8)
  $duration=[regex]::Match($content,'snapshot restores\s+(\d+)ms').Groups[1].Value
  $results+=@{run=$run;exit=$code;testMilliseconds=$duration;wallSeconds=($end-$start).TotalSeconds;cpuAtStart=$cpu.LoadPercentage;utcStart=$start.ToString('o');utcEnd=$end.ToString('o');log=$path}
  [IO.File]::WriteAllText((Join-Path $out 'timeout-measurements.json'),($results|ConvertTo-Json -Depth 5)+"`n",$utf8)
  Write-Output ('END measurement '+$run+' exit '+$code+' test '+$duration+'ms')
}
Write-Output 'Three isolated measurements complete. HOLD; no test timeout, threshold or implementation edits.'
