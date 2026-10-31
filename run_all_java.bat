@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot
set PATH=%JAVA_HOME%\bin;C:\Program Files\nodejs;%PATH%
echo ==========================================
echo   SmartBite - Java Backend + React Frontend
echo ==========================================

REM Start Java backend
start "SmartBite Java Backend" cmd /k "cd /d C:\Users\Bhuvaneswari\OneDrive\Desktop\smart-canteen-management\backend-java && java -jar target\smartbite-backend-1.0.0.jar"

REM Wait 5 seconds for backend to start
timeout /t 5 /nobreak >nul

REM Start React frontend
start "SmartBite Frontend" cmd /k "cd /d C:\Users\Bhuvaneswari\OneDrive\Desktop\smart-canteen-management\frontend && npm run dev"

echo Both servers starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Close the two terminal windows to stop the servers.
pause
