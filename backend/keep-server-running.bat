@echo off
echo 🚀 Starting PayMongo Backend Server - Will auto-restart if needed
echo 💳 GCash and PayMaya payments enabled
echo 🔄 Press Ctrl+C to stop the server completely
echo.

:restart
echo [%date% %time%] Starting server...
node index.js
echo [%date% %time%] Server stopped. Restarting in 2 seconds...
timeout /t 2 /nobreak >nul
goto restart
