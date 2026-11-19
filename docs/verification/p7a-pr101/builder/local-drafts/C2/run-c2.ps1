$ErrorActionPreference = 'Stop'
$repo = 'C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01'
$draft = Split-Path -Parent $PSScriptRoot
$runner = "$draft/C1/run-command.py"
Set-Location -LiteralPath $repo
$pin = Get-Content -LiteralPath "$PSScriptRoot/exact-head.json" -Raw -Encoding utf8 | ConvertFrom-Json
$utf8 = New-Object System.Text.UTF8Encoding($false)
$env:NO_COLOR = '1'
$started = [DateTime]::UtcNow
$completed = @()
$exitCode = 0
$problem = $null
$smokeStarted = $false

function Assert-State {
    if ((git branch --show-current) -ne $pin.branch -or (git rev-parse HEAD) -ne $pin.head -or
        (git rev-parse 'HEAD^{tree}') -ne $pin.tree -or (git rev-parse origin/main) -ne $pin.originMain -or
        (git rev-parse feat/p7a-npc-life-week) -ne $pin.base -or (git status --porcelain=v1 --untracked-files=all)) {
        throw 'HOLD: exact revision, refs, or clean worktree changed'
    }
}
function Invoke-Logged([string]$Name, [string[]]$Command) {
    Assert-State
    & python -B $runner "$PSScriptRoot/$Name.txt" -- @Command
    $code = $LASTEXITCODE
    $script:completed += [ordered]@{name=$Name;command=$Command;exitCode=$code;log="$Name.txt"}
    if ($code -ne 0) {
        $script:exitCode = $code
        throw "HOLD: $Name exited $code"
    }
}
function Machine([string]$Name) {
    & powershell.exe -NoProfile -NonInteractive -File "$PSScriptRoot/capture-machine.ps1" -Destination "$PSScriptRoot/$Name.json"
    if ($LASTEXITCODE -ne 0) { throw "HOLD: machine snapshot $Name found a competing job, held port, or capture error" }
}

try {
    Assert-State
    if(Test-Path -LiteralPath "$PSScriptRoot/gate-1-main.txt"){throw 'HOLD: C2 gate log already exists'}
    Machine 'gate-start-machine'
    Invoke-Logged 'gate-1-main' @('git','diff','--check','origin/main...HEAD')
    Invoke-Logged 'gate-1-prb' @('git','diff','--check',($pin.base+'...HEAD'))
    Invoke-Logged 'gate-2-lint' @('npm.cmd','run','lint')
    Invoke-Logged 'gate-3-typecheck' @('npm.cmd','run','typecheck')
    Invoke-Logged 'gate-4-architecture' @('npm.cmd','run','check:architecture')
    Invoke-Logged 'gate-5-architecture-tests' @('npm.cmd','run','test:architecture')
    Invoke-Logged 'gate-6-unit' @('npm.cmd','test')
    Invoke-Logged 'gate-7-build' @('npm.cmd','run','build')
    $gateLogs = @($completed | ForEach-Object {[IO.File]::ReadAllText("$PSScriptRoot/$($_.log)")})
    [IO.File]::WriteAllText("$PSScriptRoot/gates-1-7.txt",($gateLogs -join ([string][char]10 + [char]10)),$utf8)

    Invoke-Logged 'bundle-measurement' @('node',"$PSScriptRoot/measure-bundle.mjs")
    $bundle=Get-Content -LiteralPath "$PSScriptRoot/bundle-results.json" -Raw -Encoding utf8 | ConvertFrom-Json
    if($bundle.remainingBudgetBytes -le 0){throw 'HOLD: bundle is over the gzip budget'}
    Invoke-Logged 'pre-smoke-regression-build' @('npm.cmd','run','build:regression','--workspace=@haven/ui')
    Machine 'pre-preview-machine'
    Invoke-Logged 'pre-smoke-preview-verification' @('python','-B',"$PSScriptRoot/preview_proof.py")
    Machine 'pre-smoke-machine'
    Assert-State
    $env:CI='1'
    echo "CI=$env:CI"
    [IO.File]::WriteAllText("$PSScriptRoot/smoke-ci.txt","CI=$env:CI"+[char]10,$utf8)
    $smokeStarted = $true
    & python -B "$PSScriptRoot/run-smoke.py"
    if($LASTEXITCODE -ne 0){
        $exitCode=$LASTEXITCODE
        throw "HOLD: full smoke or its build proof failed (exit $exitCode)"
    }
    Assert-State
} catch {
    $problem=$_.Exception.Message
    Write-Output $problem
    if($exitCode -eq 0){$exitCode=2}
} finally {
    $finalProblem=$null
    try {
        Assert-State
        Machine 'final-machine'
    } catch { $finalProblem=$_.Exception.Message }
    $ended=[DateTime]::UtcNow
    & powershell.exe -NoProfile -NonInteractive -File "$PSScriptRoot/capture-sleep.ps1" -StartUtc $started.ToString('o') -EndUtc $ended.ToString('o') -Destination "$PSScriptRoot/sleep-resume-events.json"
    $sleepCode=$LASTEXITCODE
    if($finalProblem -or $sleepCode -ne 0){
        if($exitCode -eq 0){$exitCode=2}
        if($finalProblem){Write-Output $finalProblem}
    }
    $ports = @([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object {$_.Port -in @(4173,4174)})
    $summary=[ordered]@{head=$pin.head;tree=$pin.tree;base=$pin.base;originMain=$pin.originMain;utcStart=$started.ToString('o');utcEnd=$ended.ToString('o');checks=$completed;fullSmokeStarted=$smokeStarted;exitCode=$exitCode;problem=$problem;finalProblem=$finalProblem;sleepAuditExitCode=$sleepCode;gitStatus=@(git status --porcelain=v1 --untracked-files=all);portsFree=($ports.Count -eq 0)}
    [IO.File]::WriteAllText("$PSScriptRoot/C2-summary.json",(($summary | ConvertTo-Json -Depth 8)+[char]10),$utf8)
}
exit $exitCode
