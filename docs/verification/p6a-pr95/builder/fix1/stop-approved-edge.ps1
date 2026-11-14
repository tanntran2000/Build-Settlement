$ErrorActionPreference = 'Stop'
$taskRoot = 'C:/Users/Admin/.t3/local-drafts/p6a-prC'
$targetPid = 72952
$expectedUtc = '2026-11-14T10:00:34.2874310Z'
$started = [DateTime]::UtcNow.ToString('o')
$targetInfo = Get-CimInstance Win32_Process -Filter 'ProcessId=72952'
$result = @{ HEAD=(git rev-parse HEAD); tree=(git rev-parse 'HEAD^{tree}'); UTC=$started; ownerDecision='Stop only PID 72952'; pid=$targetPid; stopped=$false; exit=0 }
if ($targetInfo) {
  $created = $targetInfo.CreationDate.ToUniversalTime().ToString('o')
  $result.verifiedName = $targetInfo.Name
  $result.verifiedCreationUTC = $created
  if ($targetInfo.Name -ne 'msedge.exe' -or $created -ne $expectedUtc) { throw 'HOLD: PID identity no longer matches the approved process; nothing stopped' }
  $targetProcess = Get-Process -Id $targetPid -ErrorAction Stop
  if ($targetProcess.ProcessName -ne 'msedge') { throw 'HOLD: process name changed; nothing stopped' }
  try {
    Stop-Process -InputObject $targetProcess -Force -ErrorAction Stop
    $result.stopped = $true
  } catch {
    $result.exit = 1
    $result.error = $_.Exception.Message
  }
} else { $result.alreadyExited = $true }
Start-Sleep -Seconds 1
$result.stillPresent = [bool](Get-CimInstance Win32_Process -Filter 'ProcessId=72952')
$result.finishedUTC = [DateTime]::UtcNow.ToString('o')
$result | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 "$taskRoot/fix1/edge-stop-result.json"
$result | ConvertTo-Json -Depth 5
if ($result.exit -or $result.stillPresent) { throw 'HOLD: approved process could not be stopped; no other process targeted' }
