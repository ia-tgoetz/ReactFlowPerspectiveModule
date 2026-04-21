# --- Configuration ---
$ComposeDir = "igntion_test_env"
$ServiceName = "module-dev-ignition"
$ProjectName = "BrowseEditFileSystem" # Change this to your actual project name
$GatewayUrl = "module-dev-ignition.localtest.me:80" # Update if using a different port/hostname

# 1. Setup Paths
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$TargetPath = Join-Path $PSScriptRoot $ComposeDir

if (Test-Path $TargetPath) {
    Write-Host "--- Navigating to $ComposeDir ---" -ForegroundColor Cyan
    Push-Location $TargetPath

    Write-Host "--- Restarting Service: $ServiceName ---" -ForegroundColor Yellow
    docker compose restart $ServiceName

    if ($LASTEXITCODE -eq 0) {
        Write-Host "--- Success! Waiting for Gateway to initialize... ---" -ForegroundColor Green
        
        # --- START THE STOPWATCH ---
        $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        # 2. Wait-Loop using /system/gwinfo
        $IsUp = $false
        $Attempts = 0
        while (-not $IsUp -and $Attempts -lt 45) {
            try {
                $Response = Invoke-RestMethod -Uri "http://$GatewayUrl/system/gwinfo" -Method Get -TimeoutSec 2 -ErrorAction Stop
                if ($Response -like "*ContextStatus=RUNNING*") { $IsUp = $true }
            } catch { Write-Host "." -NoNewline }
            
            if (-not $IsUp) { Start-Sleep -Seconds 2; $Attempts++ }
        }

        if ($IsUp) {
            # --- STOP THE STOPWATCH & CALCULATE MS ---
            $Stopwatch.Stop()
            $StartupTimeMs = [math]::Round($Stopwatch.Elapsed.TotalMilliseconds)
            
            Write-Host "`n--- Gateway is UP! Startup took $StartupTimeMs ms. Launching Designer ---" -ForegroundColor Green
            
            # 3. 8.3 Deep Link Syntax
            # Format: designer://GatewayAddress/projectName?insecure=true
            Start-Process "designer://${GatewayUrl}/${ProjectName}?insecure=true"
        } else {
            # Be sure to stop the stopwatch even if it fails, just for good measure
            $Stopwatch.Stop()
            Write-Host "`n--- Timeout: Gateway did not reach RUNNING state. ---" -ForegroundColor Red
        }
    }
    Pop-Location
} else {
    Write-Host "Error: Could not find folder '$ComposeDir'" -ForegroundColor Red
}