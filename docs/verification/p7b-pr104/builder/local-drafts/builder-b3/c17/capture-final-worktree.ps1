$ErrorActionPreference='Stop'
$head=git rev-parse HEAD
$tree=git rev-parse 'HEAD^{tree}'
$main=git rev-parse origin/main
$branch=git branch --show-current
Write-Output "HEAD $head"
Write-Output "Tree $tree"
Write-Output "Main $main and branch $branch"
$smoke = Get-Content -LiteralPath "$PSScriptRoot/gate-8-smoke.txt" -Encoding utf8
if ($smoke[1] -ne $head -or $smoke[2] -ne $tree) { throw 'Tested commit changed' }
if ($main -ne 'b184357d235d164478584e36b96d063551124e66' -or $branch -ne 'feat/p7b-acquisition-market') { throw 'Base or branch changed' }
$status=@(git status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0 -or $status.Count) { throw "Git status has changes: $status" }
Write-Output 'Git status empty'
$ports=@(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue)
if ($ports.Count) { throw "Ports occupied: $($ports | Out-String)" }
Write-Output 'Ports 4173 and 4174 free'
git check-ignore graphify-out/graph.json .graphifyignore
if ($LASTEXITCODE -ne 0) { throw 'Graph output exclusion changed' }
git show -s --format=%B HEAD
exit 0
