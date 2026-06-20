param(
    [switch]$Install
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

$projects = @(
    @{ Title = "User Service";    Path = "services\user-service";    Command = "npm start";    Port = 4001 },
    @{ Title = "Product Service"; Path = "services\product-service"; Command = "npm start";    Port = 3002 },
    @{ Title = "Order Service";   Path = "services\order-service";   Command = "npm start";    Port = 4003 },
    @{ Title = "Payment Service"; Path = "services\payment-service"; Command = "npm start";    Port = 4006 },
    @{ Title = "Repair Service";  Path = "services\repair-service";  Command = "npm start";    Port = 4005 },
    @{ Title = "Frontend";        Path = "frontend";                 Command = "npm run dev";  Port = 5173 }
)

function Test-PortInUse {
    param([int]$Port)

    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Install-Project {
    param([string]$ProjectPath)

    $fullPath = Join-Path $Root $ProjectPath
    $nodeModules = Join-Path $fullPath "node_modules"

    if ($Install -or -not (Test-Path $nodeModules)) {
        Write-Host "npm install -> $ProjectPath"
        Push-Location $fullPath
        npm install
        Pop-Location
    }
}

function Start-ProjectWindow {
    param(
        [string]$Title,
        [string]$ProjectPath,
        [string]$Command
    )

    $fullPath = Join-Path $Root $ProjectPath
    $escapedPath = $fullPath -replace "'", "''"
    $escapedTitle = $Title -replace "'", "''"
    $escapedCommand = $Command -replace "'", "''"

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = '$escapedTitle'; Set-Location '$escapedPath'; $escapedCommand"
    )
}

Write-Host "VeloShop - uruchamianie aplikacji"
Write-Host "Katalog projektu: $Root"
Write-Host ""

foreach ($project in $projects) {
    Install-Project -ProjectPath $project.Path
}

Write-Host ""
Write-Host "Start serwisow..."

foreach ($project in $projects[0..4]) {
    if (Test-PortInUse -Port $project.Port) {
        Write-Host "  $($project.Title) juz dziala na porcie $($project.Port) - pomijam"
    } else {
        Write-Host "  $($project.Title) -> port $($project.Port)"
        Start-ProjectWindow -Title "VeloShop - $($project.Title)" -ProjectPath $project.Path -Command $project.Command
        Start-Sleep -Seconds 1
    }
}

$frontend = $projects[5]
if (Test-PortInUse -Port $frontend.Port) {
    Write-Host "  Frontend juz dziala na porcie $($frontend.Port) - pomijam"
} else {
    Write-Host "  Frontend -> port $($frontend.Port)"
    Start-ProjectWindow -Title "VeloShop - Frontend" -ProjectPath $frontend.Path -Command $frontend.Command
}

Write-Host ""
Write-Host "Czekam na frontend..."
Start-Sleep -Seconds 4
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Gotowe. Aplikacja: http://localhost:5173"
Write-Host "Konta testowe: user/user, admin/admin"
