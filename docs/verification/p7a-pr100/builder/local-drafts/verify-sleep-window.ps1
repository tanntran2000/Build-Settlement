# Evidence-only correction: Get-WinEvent FilterHashtable dates were interpreted in
# local time. Explicit SystemTime XPath literals keep the requested UTC window.
$ErrorActionPreference = 'Stop'
$evidenceDir = 'C:/Users/Admin/.t3/local-drafts/p7a-prB'
$summary = Get-Content -LiteralPath "$evidenceDir/B2-summary.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$original = "$evidenceDir/sleep-resume-events-filterHashtable-history.json"
if (-not (Test-Path -LiteralPath $original)) { Copy-Item -LiteralPath "$evidenceDir/sleep-resume-events.json" -Destination $original }
$windows = @(
    @{Name='sleep-resume-events.json';Start=$summary.windowStartUtc;End=$summary.windowEndUtc},
    @{Name='B1-perf-sleep-resume-utc.json';Start='2026-11-17T14:59:24.8608161Z';End='2026-11-17T15:02:18.4074542Z'}
)
foreach ($window in $windows) {
    $start = [DateTimeOffset]::Parse($window.Start).UtcDateTime
    $end = [DateTimeOffset]::Parse($window.End).UtcDateTime
    $from = $start.ToString("yyyy-MM-ddTHH:mm:ss.fffffff'Z'")
    $to = $end.ToString("yyyy-MM-ddTHH:mm:ss.fffffff'Z'")
    $events = @()
    $queries = @()
    foreach ($selection in @(
        @{Provider='Microsoft-Windows-Power-Troubleshooter';Ids='EventID=1'},
        @{Provider='Microsoft-Windows-Kernel-Power';Ids='(EventID=42 or EventID=107 or EventID=506 or EventID=507)'}
    )) {
        $query = "*[System[Provider[@Name='$($selection.Provider)'] and $($selection.Ids) and TimeCreated[@SystemTime >= '$from' and @SystemTime <= '$to']]]"
        $queries += $query
        try { $matches = @(Get-WinEvent -LogName System -FilterXPath $query -ErrorAction Stop) }
        catch { if ($_.FullyQualifiedErrorId -match 'NoMatchingEventsFound') { $matches=@() } else { throw } }
        foreach ($event in $matches) {
            $xml = [xml]$event.ToXml()
            $utc = [DateTimeOffset]::Parse($xml.Event.System.TimeCreated.SystemTime).UtcDateTime
            if ($utc -lt $start -or $utc -gt $end) { throw 'UTC query returned an out-of-window event.' }
            $events += [ordered]@{utc=$utc.ToString('o');id=$event.Id;provider=$event.ProviderName;recordId=$event.RecordId;xml=$event.ToXml()}
        }
    }
    [ordered]@{windowStartUtc=$from;windowEndUtc=$to;queryMode='Explicit UTC SystemTime XPath; independent XML timestamp bounds check';queries=$queries;events=$events;eventCount=$events.Count;queryUtc=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$evidenceDir/$($window.Name)" -Encoding UTF8
    Write-Output "$($window.Name): $($events.Count) events inside $from through $to"
}
