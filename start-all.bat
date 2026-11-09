@echo off
chcp 65001 >nul
echo ====================================================
echo   KHOI DONG HE THONG CHAM CONG KHUON MAT ESP32-CAM
echo ====================================================

echo [1/4] Dang mo Python AI Server (Port 8000)...
start "1. Python AI Server (Port 8000)" cmd /k "cd /d d:\Face\ai_attendance_server && .\.venv\Scripts\uvicorn.exe app:app --host 0.0.0.0 --port 8000"

echo [2/4] Dang mo UDP Broadcast Discovery (Port 45678)...
start "2. UDP Discovery (Port 45678)" cmd /k "cd /d d:\Face\ai_attendance_server && .\.venv\Scripts\python.exe -u udp_broadcast.py"

echo [3/4] Dang mo .NET Backend API (Port 5028)...
start "3. .NET Backend API (Port 5028)" cmd /k "cd /d d:\Face\back_end_system\Hrms.Api && set ASPNETCORE_ENVIRONMENT=Development && dotnet run --launch-profile http"

echo [4/4] Dang mo Expo Frontend (Port 8081)...
start "4. Expo Frontend (Port 8081)" cmd /k "cd /d d:\Face\front_end_system && npx expo start --port 8081"

echo.
echo Da khoi dong ca 4 cua so dich vu!
echo - Swagger Backend : http://localhost:5028/swagger
echo - Python AI Docs  : http://localhost:8000/docs
echo - Expo Web / App  : http://localhost:8081
echo - Admin Login     : admin / password123
pause

