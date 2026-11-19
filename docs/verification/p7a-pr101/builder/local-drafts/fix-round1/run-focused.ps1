param([Parameter(Mandatory=$true)][ValidateSet('red','green')][string]$Phase)
$ErrorActionPreference = 'Stop'
$repo = 'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01'
$draft = Split-Path -Parent $PSScriptRoot
$runner = "$draft/C1/run-command.py"
$raw = "$(Split-Path -Parent $draft)/p7a-prC-local-only/fix-round1"
$cli = "$repo/node_modules/@playwright/test/cli.js"
$utf8 = New-Object System.Text.UTF8Encoding($false)
$env:CI = '1'
$env:NO_COLOR = '1'
Set-Location -LiteralPath $repo

function Save-Scope([string]$Mode, [string]$Name) {
  $json = & python -B "$PSScriptRoot/verify-correction10.py" $Mode
  if ($LASTEXITCODE -ne 0) { throw "Correction 10 scope check $Mode failed" }
  [IO.File]::WriteAllText("$PSScriptRoot/$Name.json", ($json -join [char]10) + [char]10, $utf8)
}
function Run-Logged([string]$Name, [string[]]$Command) {
  & python -B $runner "$PSScriptRoot/$Name.txt" -- @Command
}
function Require-ExitZero([string]$Name, [string[]]$Command) {
  Run-Logged $Name $Command
  if ($LASTEXITCODE -ne 0) { throw "$Name exited $LASTEXITCODE" }
}
function Require-FreePorts {
  $occupied = @([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object {$_.Port -in @(4173,4174)})
  if ($occupied.Count) { throw "Preview ports already in use: $occupied" }
}

Require-FreePorts
$mode = if ($Phase -eq 'red') { 'red' } else { 'worktree' }
Save-Scope $mode "$Phase-before-build-scope"
Require-ExitZero "$Phase-production-build" @('npm.cmd','run','build')
Require-ExitZero "$Phase-regression-build" @('npm.cmd','run','build:regression','--workspace=@haven/ui')
Save-Scope $mode "$Phase-before-test-scope"
Write-Output "CI=$env:CI"

if ($Phase -eq 'red') {
  Run-Logged 'red-keyboard' @('node',$cli,'test','tests/e2e/npc-sheet.spec.ts','--project','chromium','--grep','NPC sheet has one tab stop and linked keyboard panels$','--output',"$raw/RED")
  $exitCode = $LASTEXITCODE
  Require-FreePorts
  exit $exitCode
}

$failureCount = 0
foreach ($width in @(1600,1280,375,320)) {
  Require-FreePorts
  Run-Logged "baseline-$width-CI1" @('node',$cli,'test','tests/e2e/character-life-navigation-accessibility.spec.ts:250','--project','chromium','--grep',"accessibility at ${width}px life shell accessibility baseline$",'--output',"$raw/baseline-$width")
  $exitCode = $LASTEXITCODE
  $result = [IO.File]::ReadAllText("$PSScriptRoot/baseline-$width-CI1.txt")
  if ($exitCode -ne 0 -or $result -notmatch '(?m)^Running 1 test using 1 worker' -or $result -notmatch '(?m)^  1 passed') { $failureCount++ }
}
if ($failureCount) {
  Write-Output "HOLD: $failureCount baseline checks did not pass"
  exit 1
}

Require-FreePorts
Run-Logged 'green-focused-CI1' @('node',$cli,'test','tests/e2e/npc-sheet.spec.ts','--project','chromium','--output',"$raw/GREEN")
$exitCode = $LASTEXITCODE
Require-FreePorts
Save-Scope 'worktree' 'green-after-test-scope'
exit $exitCode
