# run.ps1 - Run Flask backend and React frontend on Windows

# Start Flask backend
Write-Output "Starting backend..."
cd backend
. .\venv\Scripts\Activate.ps1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python app.py"
cd ..

# Start React frontend
Write-Output "Starting frontend..."
cd frontend
npm run dev

Start-Process "http://localhost:5173"
