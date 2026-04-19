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
            Write-Host "`n--- Gateway is UP! Launching Designer ---" -ForegroundColor Green
            
            # 3. 8.3 Deep Link Syntax
            # Format: designer://GatewayAddress/projectName?insecure=true
            # $DeepLink = "designer://${GatewayUrl}/${ProjectName}?insecure=true"
            
            # Write-Host "Executing: $DeepLink" -ForegroundColor Gray
            # Start-Process $DeepLink
            Start-Process "designer://${GatewayUrl}/${ProjectName}?insecure=true"
        } else {
            Write-Host "`n--- Timeout: Gateway did not reach RUNNING state. ---" -ForegroundColor Red
        }
    }
    Pop-Location
} else {
    Write-Host "Error: Could not find folder '$ComposeDir'" -ForegroundColor Red
}