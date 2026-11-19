param([string]$StartUtc,[string]$EndUtc,[string]$Destination)
$ErrorActionPreference='Stop'
$start=[DateTimeOffset]::Parse($StartUtc).UtcDateTime
$end=[DateTimeOffset]::Parse($EndUtc).UtcDateTime
$from=$start.ToString("yyyy-MM-ddTHH:mm:ss.fffffff'Z'")
$to=$end.ToString("yyyy-MM-ddTHH:mm:ss.fffffff'Z'")
$events=@();$queries=@()
foreach($selection in @(@{Provider='Microsoft-Windows-Power-Troubleshooter';Ids='EventID=1'},@{Provider='Microsoft-Windows-Kernel-Power';Ids='(EventID=42 or EventID=107 or EventID=506 or EventID=507)'})){
    $query="*[System[Provider[@Name='$($selection.Provider)'] and $($selection.Ids) and TimeCreated[@SystemTime >= '$from' and @SystemTime <= '$to']]]"
    $queries+=$query
    try{$found=@(Get-WinEvent -LogName System -FilterXPath $query -ErrorAction Stop)}
    catch{if($_.FullyQualifiedErrorId -match 'NoMatchingEventsFound'){$found=@()}else{throw}}
    foreach($event in $found){
        $xml=[xml]$event.ToXml();$utc=[DateTimeOffset]::Parse($xml.Event.System.TimeCreated.SystemTime).UtcDateTime
        if($utc -lt $start -or $utc -gt $end){throw 'Out-of-window event'}
        $events+=[ordered]@{utc=$utc.ToString('o');id=$event.Id;provider=$event.ProviderName;recordId=$event.RecordId;xml=$event.ToXml()}
    }
}
[ordered]@{windowStartUtc=$from;windowEndUtc=$to;queryMode='Explicit UTC SystemTime XPath with XML timestamp verification';queries=$queries;events=$events;eventCount=$events.Count} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Destination -Encoding UTF8
