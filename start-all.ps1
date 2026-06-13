# Start both backend and frontend for CyberGuard AI on Windows.
# Usage: Open PowerShell in the repo root and run `./start-all.ps1`

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'
$venvDir = Join-Path $backendDir '.venv'
$activateScript = Join-Path $venvDir 'Scripts\Activate.ps1'

Write-Host 'Root:' $root
Write-Host 'Backend:' $backendDir
Write-Host 'Frontend:' $frontendDir

if (-not (Test-Path $activateScript)) {
    Write-Host 'Creating Python virtual environment...' -ForegroundColor Cyan
    python -m venv $venvDir
}

$venvPython = Join-Path $venvDir 'Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    Write-Error 'Unable to find the Python executable in the virtual environment.'
    exit 1
}

Write-Host 'Installing backend requirements...' -ForegroundColor Cyan
& $venvPython -m pip install -r (Join-Path $backendDir 'requirements.txt')

Write-Host 'Installing frontend dependencies...' -ForegroundColor Cyan
Push-Location $frontendDir
npm install
Pop-Location

Write-Host 'Starting backend and frontend in separate PowerShell windows...' -ForegroundColor Green

$backendCommand = "Set-Location '$backendDir'; & '$venvPython' -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
$frontendCommand = "Set-Location '$frontendDir'; npm run dev"

Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $backendCommand
Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host 'Done. Backend: http://127.0.0.1:8000   Frontend: http://localhost:3000' -ForegroundColor Green
