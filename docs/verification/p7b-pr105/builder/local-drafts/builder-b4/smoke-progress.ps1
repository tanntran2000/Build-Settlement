param([string]$Tag = '-c24')
$path=Join-Path $PSScriptRoot "gate-8-smoke$Tag.txt"
if(!(Test-Path -LiteralPath $path)){ Write-Output 'Smoke is waiting for the exact-head build.'; exit 0 }
$lines=Get-Content -Encoding UTF8 -LiteralPath $path
$started=$lines | Where-Object {$_ -match '^Running \d+ tests'} | Select-Object -Last 1
$count=[regex]::Matches(($lines -join [char]10),'(?m)^  ok +\d+ ').Count
$failures=$lines | Where-Object {$_ -match '^  [x×✘] +\d+ '}
[pscustomobject]@{ UTC=[DateTime]::UtcNow.ToString('o'); Started=$started; Passed=$count; Failed=@($failures).Count; LastTest=($lines | Where-Object {$_ -match '^  (ok|x|×|✘) ' } | Select-Object -Last 1); Exit=($lines | Where-Object {$_ -match '^Exit \d+'} | Select-Object -Last 1) } | Format-List
$failures | Select-Object -First 15
