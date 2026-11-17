$ErrorActionPreference='Stop'
$evidence='C:/Users/Admin/.t3/local-drafts/p6b-prC'
$sha='C:/Program Files/Git/usr/bin/sha256sum.exe'
$utf8=[Text.UTF8Encoding]::new($false)
Set-Location -LiteralPath $evidence
$transcript=Join-Path $evidence 'checksum-verification.txt'
$start=[DateTime]::UtcNow
[IO.File]::WriteAllText($transcript,"Checksum verification transcript pending final freeze.`n",$utf8)
& node (Join-Path $evidence 'refresh-sha256.mjs')
if($LASTEXITCODE -ne 0){throw 'Manifest generation failed'}
$topOutput=@(& $sha -c SHA256SUMS.txt 2>&1)
$topExit=$LASTEXITCODE
if($topExit -ne 0){throw 'Initial top-level checksum verification failed'}
Set-Location -LiteralPath (Join-Path $evidence 'bundle-artifacts')
$nestedOutput=@(& $sha -c SHA256SUMS.txt 2>&1)
$nestedExit=$LASTEXITCODE
Set-Location -LiteralPath $evidence
if($nestedExit -ne 0){throw 'Nested bundle checksum verification failed'}
Set-Location -LiteralPath (Join-Path $evidence 'fix-round1/bundle-artifacts')
$fixNestedOutput=@(& $sha -c SHA256SUMS.txt 2>&1)
$fixNestedExit=$LASTEXITCODE
Set-Location -LiteralPath $evidence
if($fixNestedExit -ne 0){throw 'Fix-round bundle checksum verification failed'}
$coverageOutput=@(& node (Join-Path $evidence 'refresh-sha256.mjs') --verify 2>&1)
$coverageExit=$LASTEXITCODE
if($coverageExit -ne 0){throw 'Coverage/UTF-8 verification failed'}
$content='UTC_START: '+$start.ToString('o')+"`nHEAD: ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37`nTREE: a164cb535cb914ee19f6e027b97013479c08e786`nSTATUS: HOLD - uncommitted round-2 extraction; checksum verification only`nCOMMAND: sha256sum.exe -c SHA256SUMS.txt`n"+($topOutput -join "`n")+"`nEXIT: $topExit`nCOMMAND: sha256sum.exe -c SHA256SUMS.txt (bundle-artifacts working directory)`n"+($nestedOutput -join "`n")+"`nEXIT: $nestedExit`nCOMMAND: node refresh-sha256.mjs --verify`n"+($coverageOutput -join "`n")+"`nEXIT: $coverageExit`nUTC_END: "+[DateTime]::UtcNow.ToString('o')+"`nThis transcript is now frozen. The script refreshes the manifest to include these transcript bytes and repeats the same checks without further file edits; the final repeat output is in the Builder tool transcript.`n"
$content+="COMMAND: sha256sum.exe -c SHA256SUMS.txt (fix-round1/bundle-artifacts working directory)`n"+($fixNestedOutput -join "`n")+"`nEXIT: $fixNestedExit`n"
[IO.File]::WriteAllText($transcript,$content,$utf8)
& node (Join-Path $evidence 'refresh-sha256.mjs')
if($LASTEXITCODE -ne 0){throw 'Final manifest generation failed'}
& $sha -c SHA256SUMS.txt
if($LASTEXITCODE -ne 0){throw 'Final top-level checksum verification failed'}
Set-Location -LiteralPath (Join-Path $evidence 'bundle-artifacts')
& $sha -c SHA256SUMS.txt
$finalNestedExit=$LASTEXITCODE
Set-Location -LiteralPath $evidence
if($finalNestedExit -ne 0){throw 'Final nested checksum verification failed'}
Set-Location -LiteralPath (Join-Path $evidence 'fix-round1/bundle-artifacts')
& $sha -c SHA256SUMS.txt
$finalFixNestedExit=$LASTEXITCODE
Set-Location -LiteralPath $evidence
if($finalFixNestedExit -ne 0){throw 'Final fix-round nested checksum verification failed'}
& node (Join-Path $evidence 'refresh-sha256.mjs') --verify
if($LASTEXITCODE -ne 0){throw 'Final coverage/UTF-8 verification failed'}
Write-Output 'FINAL CHECKSUMS PASS; all evidence files frozen, including the transcript and nested manifest.'
