<#
.SYNOPSIS
Start the backend using the local virtual environment.

.DESCRIPTION
This script activates the backend .venv and launches Uvicorn for FastAPI.
#>

param(
    [string]$Host = "127.0.0.1",
    [int]$Port = 8000,
    [switch]$Reload
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$activatePath = Join-Path $scriptDir ".venv\Scripts\Activate.ps1"

if (-not (Test-Path $activatePath)) {
    Write-Error "Cannot find virtual environment activation script at $activatePath.`nCreate it with: python -m venv .venv"
    exit 1
}

. $activatePath

$pythonPath = Join-Path $scriptDir ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonPath)) {
    Write-Error "Cannot find Python interpreter at $pythonPath. Create the venv with: python -m venv .venv"
    exit 1
}

$uvicornArgs = @("-m", "uvicorn", "main:app", "--host", $Host, "--port", $Port)
if ($Reload) { $uvicornArgs += "--reload" }

& $pythonPath @uvicornArgs
