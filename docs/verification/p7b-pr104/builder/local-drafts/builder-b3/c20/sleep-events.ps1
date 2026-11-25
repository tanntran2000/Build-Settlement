$ErrorActionPreference='Stop'
$events=Get-WinEvent -FilterHashtable @{
  LogName='System'; ProviderName='Microsoft-Windows-Power-Troubleshooter'; Id=1; StartTime=[datetime]'2026-11-25T05:43:07'
}
foreach($event in $events) {
  Write-Output "Event UTC $($event.TimeCreated.ToUniversalTime().ToString('o'))"
  $xml=[xml]$event.ToXml()
  foreach($field in $xml.Event.EventData.Data) {
    if ($field.Name -in @('SleepTime','WakeTime','SleepDuration','WakeDuration','HiberWriteDuration','TargetState','EffectiveState')) {
      Write-Output "$($field.Name) $($field.'#text')"
    }
  }
}
