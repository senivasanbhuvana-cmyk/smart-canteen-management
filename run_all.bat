@echo off
echo ====================================================
echo Launching SmartBite Canteen System (Node.js + React)
echo ====================================================

start "SmartBite Backend (Express :5000)" cmd /k "cd /d %~dp0backend && node src/server.js"
timeout /t 3 /nobreak >nul
start "SmartBite Frontend (React :5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both servers are starting up!
echo Frontend will be accessible at: http://localhost:5173
echo Backend API is running at:      http://localhost:5000
echo Admin Login:   admin@smartbite.com / admin123
echo Student Login: student@campus.edu / student123
pause
