# Stop typical Vireon dev listeners (does not kill arbitrary Node apps).
$ports = @(5000, 5173, 5174, 5175)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        if ($procId -gt 0) {
            try {
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Host "Stopped process $procId (port $port)"
            } catch {
                Write-Host "Could not stop PID $procId : $_"
            }
        }
    }
}
Write-Host "Done."
