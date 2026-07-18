@echo off
echo ╔════════════════════════════════════════════╗
echo ║   EHN One - Backend Server Setup          ║
echo ╚════════════════════════════════════════════╝
echo.

cd backend

echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Seeding database...
call npm run seed

echo.
echo [3/3] Starting server...
call npm start
