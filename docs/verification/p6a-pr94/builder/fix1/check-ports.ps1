$ports = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) })
if ($ports.Count -gt 0) {
  $ports | Format-List LocalAddress,LocalPort,OwningProcess
  Write-Output 'HOLD: a required smoke port is occupied; no process was killed.'
  exit 1
}
Write-Output 'PASS: ports 4173 and 4174 are free. No process was killed.'
exit 0
