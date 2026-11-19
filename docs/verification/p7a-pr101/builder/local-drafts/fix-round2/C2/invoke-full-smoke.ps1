param([Parameter(Mandatory=$true)][string]$Artifacts)
$ErrorActionPreference = 'Stop'
$env:CI = '1'
echo "CI=$env:CI"
[IO.File]::WriteAllText("$PSScriptRoot/smoke-ci.txt", "CI=$env:CI"+[char]10, [Text.UTF8Encoding]::new($false))
& npm.cmd run test:smoke -- --output $Artifacts
exit $LASTEXITCODE
