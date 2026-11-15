param([Parameter(Mandatory=$true)][string]$Name, [Parameter(Mandatory=$true)][string]$Command)
$ErrorActionPreference = 'Continue'
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6b-prA'
$taskLog = Join-Path $taskRoot ($Name + '.txt')
$taskUtf8 = New-Object System.Text.UTF8Encoding($false)
$taskHeader = "HEAD: $(git rev-parse HEAD)`nTree: $(git rev-parse 'HEAD^{tree}')`nUTC: $([DateTime]::UtcNow.ToString('o'))`nCommand: $Command`nStatus before:`n$(git status --porcelain=v1)`n"
[IO.File]::WriteAllText($taskLog, $taskHeader, $taskUtf8)
$taskStart = Get-Date
& $env:ComSpec /d /s /c "($Command) >> `"$taskLog`" 2>&1"
$taskExit = $LASTEXITCODE
[IO.File]::AppendAllText($taskLog, "`nExit: $taskExit`nUTC end: $([DateTime]::UtcNow.ToString('o'))`nElapsed seconds: $(((Get-Date)-$taskStart).TotalSeconds)`n", $taskUtf8)
Get-Content -LiteralPath $taskLog -Tail 26 -Encoding UTF8
exit $taskExit
