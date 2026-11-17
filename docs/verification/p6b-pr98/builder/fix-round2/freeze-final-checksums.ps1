$ErrorActionPreference='Stop'
$evidence='C:/Users/Admin/.t3/local-drafts/p6b-prC'
$sha='C:/Program Files/Git/usr/bin/sha256sum.exe'
$utf8=[Text.UTF8Encoding]::new($false)
$head='060baa24d44d6a61c2b184a77ab161ae6f62d610'
$tree='77cbeae3332cfaf26ba23e08ae67300d49d8c69d'
Set-Location -LiteralPath $evidence
function Check-AllManifests {
  $topManifest=Get-Item -LiteralPath (Join-Path $evidence 'SHA256SUMS.txt')
  $manifests=@($topManifest)+@(Get-ChildItem -LiteralPath $evidence -Recurse -File -Filter SHA256SUMS.txt | Where-Object {$_.FullName -ne $topManifest.FullName})
  foreach($manifest in $manifests){
    Set-Location -LiteralPath $manifest.DirectoryName
    Write-Output ('MANIFEST: '+$manifest.FullName)
    & $sha -c $manifest.Name
    if($LASTEXITCODE -ne 0){throw ('Checksum verification failed: '+$manifest.FullName)}
  }
  Set-Location -LiteralPath $evidence
  & node (Join-Path $evidence 'refresh-sha256.mjs') --verify
  if($LASTEXITCODE -ne 0){throw 'Coverage/UTF-8 check failed'}
}
$log=Join-Path $evidence 'checksum-verification.txt'
$start=[DateTime]::UtcNow
[IO.File]::WriteAllText($log,"Final checksum freeze pending.`n",$utf8)
& node (Join-Path $evidence 'refresh-sha256.mjs')
if($LASTEXITCODE -ne 0){throw 'Initial manifest refresh failed'}
$initial=@(Check-AllManifests)
$transcript="UTC_START: "+$start.ToString('o')+"`nHEAD: $head`nTREE: $tree`nCOMMAND: sha256sum.exe -c for the top-level and every nested SHA256SUMS.txt, then node refresh-sha256.mjs --verify`n"+($initial -join "`n")+"`nEXIT: 0`nUTC_END: "+[DateTime]::UtcNow.ToString('o')+"`nThis transcript is frozen. The manifest is refreshed to include these transcript bytes; the same checks repeat below without any further file edits.`n"
[IO.File]::WriteAllText($log,$transcript,$utf8)
& node (Join-Path $evidence 'refresh-sha256.mjs')
if($LASTEXITCODE -ne 0){throw 'Final manifest refresh failed'}
Check-AllManifests
Write-Output 'FINAL CHECKSUMS PASS: full recursive coverage, all nested manifests, UTF-8, frozen transcript.'
