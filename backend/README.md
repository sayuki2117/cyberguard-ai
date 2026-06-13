# Backend

## Run locally

### PowerShell
```powershell
cd backend
.\start.ps1 -Reload
```

### Bash
```bash
cd backend
./start.sh 8000
```

### If the virtual environment is missing
```bash
python -m venv .venv
```

This ensures the backend uses the local `backend/.venv` environment so `uvicorn` is available.
