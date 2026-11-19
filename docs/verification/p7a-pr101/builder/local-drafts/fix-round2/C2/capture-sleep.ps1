param([string]$StartUtc, [string]$EndUtc, [string]$Destination)
$ErrorActionPreference = 'Stop'
$start = [DateTimeOffset]::Parse($StartUtc).UtcDateTime
$end = [DateTimeOffset]::Parse($EndUtc).UtcDateTime
$from = $start.ToString("yyyy-MM-ddTHH:mm:ss.fffffff'Z'")
$to = $end.ToString("yyyy-MM-ddTHH:mm:ss.fffffff'Z'")
$queries = @()
$events = @(foreach ($selection in @(
    @{Provider='Microsoft-Windows-Power-Troubleshooter'; Ids='EventID=1'},
    @{Provider='Microsoft-Windows-Kernel-Power'; Ids='(EventID=42 or EventID=107 or EventID=506 or EventID=507)'}
)) {
    $xpath = "*[System[Provider[@Name='$($selection.Provider)'] and $($selection.Ids) and TimeCreated[@SystemTime >= '$from' and @SystemTime <= '$to']]]"
    $queries += $xpath
    try {
        $found = @(Get-WinEvent -LogName System -FilterXPath $xpath -ErrorAction Stop)
    } catch {
        if ($_.FullyQualifiedErrorId -notmatch 'NoMatchingEventsFound') { throw }
        $found = @()
    }
    foreach ($event in $found) {
        $xml = [xml]$event.ToXml()
        $utc = [DateTimeOffset]::Parse($xml.Event.System.TimeCreated.SystemTime).UtcDateTime
        if ($utc -lt $start -or $utc -gt $end) { throw 'Out-of-window event' }
        [ordered]@{ utc = $utc.ToString('o'); provider = $event.ProviderName; eventId = $event.Id; recordId = $event.RecordId }
    }
})
$result = [ordered]@{
    windowStartUtc = $from
    windowEndUtc = $to
    queryMode = 'System event log with explicit UTC SystemTime XPath and XML timestamp verification'
    queries = $queries
    eventCount = $events.Count
    events = @($events | Sort-Object { $_.utc })
}
$json = $result | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($Destination, $json + [char]10, (New-Object System.Text.UTF8Encoding($false)))
