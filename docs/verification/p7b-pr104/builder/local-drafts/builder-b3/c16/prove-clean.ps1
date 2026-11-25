$ErrorActionPreference='Stop'
$head=git rev-parse HEAD
$tree=git rev-parse 'HEAD^{tree}'
$main=git rev-parse origin/main
$branch=git branch --show-current
if ($head -ne '8aa7dc4cefbc759ce2a7d158937011c3afe71549' -or $tree -ne 'a44d6bcd31a26f3519a39f5b71e481045a2b9318' -or $branch -ne 'feat/p7b-acquisition-market') { throw 'Unexpected reviewed checkout' }
if ($main -ne 'b184357d235d164478584e36b96d063551124e66') { throw 'Unexpected fetched main' }
$entries=(Get-Content "$PSScriptRoot/correction16-byte-inventory.json" -Raw -Encoding utf8 | ConvertFrom-Json).entries
foreach ($entry in $entries) {
  $hash=(Get-FileHash -LiteralPath $entry.path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($hash -ne $entry.oldSha256) { throw "Unexpected restored bytes for $($entry.path)" }
}
if (@(git status --porcelain=v1 --untracked-files=all).Count) { throw 'Worktree is dirty' }
git -c core.autocrlf=false apply --check "$PSScriptRoot/candidate-held.patch"
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
if (@(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue).Count) { throw 'Required ports occupied' }
git check-ignore graphify-out/graph.json .graphifyignore
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Output "HEAD $head"
Write-Output "Tree $tree"
Write-Output "Branch $branch"
Write-Output "Fetched main $main"
Write-Output 'All ten restored files match their original SHA-256. Patch forward check passed.'
Write-Output 'Git status empty. Ports 4173 and 4174 free.'
exit 0
