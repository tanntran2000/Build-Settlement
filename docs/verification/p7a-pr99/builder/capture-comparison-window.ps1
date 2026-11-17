$ErrorActionPreference = 'Stop'
$taskEvidence = 'C:\Users\Admin\.t3\local-drafts\p7a-prA'
$taskFirst = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskEvidence 'baseline-comparison/summary.json') | ConvertFrom-Json
$taskStart = [DateTime]::Parse($taskFirst.windowStartUtc).ToUniversalTime()
$taskEnd = [DateTime]::UtcNow
$taskEvents = @()
$taskQueries = @(
    @{LogName='System';ProviderName='Microsoft-Windows-Power-Troubleshooter';Id=1;StartTime=$taskStart;EndTime=$taskEnd},
    @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=@(42,107,506,507);StartTime=$taskStart;EndTime=$taskEnd}
)
foreach ($taskQuery in $taskQueries) {
    try { $taskMatches = @(Get-WinEvent -FilterHashtable $taskQuery -ErrorAction Stop) }
    catch {
        if ($_.FullyQualifiedErrorId -match 'NoMatchingEventsFound') { $taskMatches = @() }
        else { throw }
    }
    foreach ($taskEvent in $taskMatches) {
        $taskEvents += [ordered]@{utc=$taskEvent.TimeCreated.ToUniversalTime().ToString('o');id=$taskEvent.Id;provider=$taskEvent.ProviderName;recordId=$taskEvent.RecordId;xml=$taskEvent.ToXml()}
    }
}
[ordered]@{windowStartUtc=$taskStart.ToString('o');windowEndUtc=$taskEnd.ToString('o');scope='entire approved diagnostic window, including preliminary attempts, stopped helper and matched runs';eventCount=$taskEvents.Count;events=$taskEvents} | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskEvidence 'baseline-comparison-matched/whole-window-sleep-resume.json')
Write-Output "Whole comparison window: $($taskStart.ToString('o')) to $($taskEnd.ToString('o')); events=$($taskEvents.Count)"
