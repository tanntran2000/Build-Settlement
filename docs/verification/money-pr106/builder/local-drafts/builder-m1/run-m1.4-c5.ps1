param([ValidateRange(1,8)][int]$From=1,[ValidateRange(1,2)][int]$Attempt=1)
$ErrorActionPreference='Stop'
$head=((Get-Content "$PSScriptRoot/m1.4-c5-commit.txt" -Encoding UTF8 | Select-String '^HEAD [0-9a-f]{40}$').Line).Substring(5)
$since=[DateTime]::UtcNow.ToString('o')
$tag="m1.4-c5-attempt$Attempt"
$capture=Join-Path $PSScriptRoot 'capture-environment.ps1'
$runner=Join-Path $PSScriptRoot 'run-logged.py'
$probe=Join-Path $PSScriptRoot 'probe-m1.4-c5-idle.py'
$env:VITEST_MAX_WORKERS='3'
Remove-Item Env:CI -ErrorAction SilentlyContinue
function Assert-Head {
  if((git rev-parse HEAD) -ne $head -or (git status --porcelain=v1)) { throw 'Exact head or clean status changed' }
  if((git rev-parse origin/main) -ne 'ab83228df9ee1c70f97c634324c3202e2def0ea0') { throw 'Unexpected baseline' }
}
function Capture-State([string]$label) {
  & $capture "$tag-$label" $since
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
function Wait-Quiet([string]$label) {
  $path="$PSScriptRoot/$tag-$label-idle.txt"
  "Head $head. Windows GetSystemTimes samples. Scheduling targets are mean <= 18% and each interval <= 25%." |
    Set-Content -LiteralPath $path -Encoding UTF8
  while($true){
    Assert-Head
    if(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue){
      throw 'A requested browser test port is in use before the run'
    }
    $first=@{}
    Get-Process | ForEach-Object { $first[$_.Id]=$_.CPU }
    $data=python $probe
    if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
    $data | Add-Content -LiteralPath $path -Encoding UTF8
    $sample=$data | ConvertFrom-Json
    if($sample.meanCpuPercent -le 18 -and ($sample.twoSecondCpuPercent | Measure-Object -Maximum).Maximum -le 25){
      "Selected quiet window $($sample.utc)" | Add-Content -LiteralPath $path -Encoding UTF8
      $top=Get-Process | Where-Object { $first.ContainsKey($_.Id) } | Select-Object Name,Id,
        @{Name='CPUSecondsOverSample';Expression={[Math]::Round($_.CPU-$first[$_.Id],3)}} |
        Sort-Object CPUSecondsOverSample -Descending | Select-Object -First 12 | Format-Table -AutoSize | Out-String
      "Top process CPU seconds in the selected window" | Add-Content -LiteralPath $path -Encoding UTF8
      $top | Add-Content -LiteralPath $path -Encoding UTF8
      "$label CPU samples $($sample.twoSecondCpuPercent -join '% / ')%"
      return
    }
  }
}
function Run-Gate([int]$number,[string]$label,[string[]]$arguments) {
  if($number -lt $From){return}
  $log="$tag-gate-$number-$label.txt"
  if(Test-Path -LiteralPath "$PSScriptRoot/$log"){throw "Evidence already exists for $log"}
  Assert-Head
  python $runner $log @arguments
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
  Assert-Head
}
Assert-Head
@("HEAD=$head","VITEST_MAX_WORKERS=$env:VITEST_MAX_WORKERS","Stages 1-7 CI unset. Stage 8 CI=1.") |
  Set-Content "$PSScriptRoot/$tag-execution-environment.txt" -Encoding UTF8
if($From -lt 8){
  Capture-State 'before-gates'
  Wait-Quiet 'before-gates'
}
Run-Gate 1 'diff' @('git','diff','--check','origin/main...HEAD')
Run-Gate 2 'lint' @('npm.cmd','run','lint')
Run-Gate 3 'typecheck' @('npm.cmd','run','typecheck')
Run-Gate 4 'architecture' @('npm.cmd','run','check:architecture')
Run-Gate 5 'architecture-tests' @('npm.cmd','run','test:architecture')
Run-Gate 6 'unit' @('npm.cmd','test')
Run-Gate 7 'build' @('npm.cmd','run','build')
Capture-State 'before-smoke'
Wait-Quiet 'before-smoke'
$env:CI='1'
Run-Gate 8 'smoke' @('npm.cmd','run','test:smoke')
Capture-State 'after-smoke'
exit 0
