@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo.
echo  Thaali Tracker - Starting up...
echo.

where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo  Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)
echo  Node.js found

echo.
echo  Installing backend dependencies...
pushd "%BACKEND%"
call npm install
if errorlevel 1 ( echo  Backend install failed & popd & pause & exit /b 1 )
popd

echo.
echo  Installing frontend dependencies...
pushd "%FRONTEND%"
call npm install
if errorlevel 1 ( echo  Frontend install failed & popd & pause & exit /b 1 )

echo.
echo  Building frontend (this takes ~1-2 min)...
call npm run build
if errorlevel 1 ( echo  Build failed & popd & pause & exit /b 1 )
popd

echo.
echo  Starting server at http://localhost:5000
echo  Open that URL in your browser now!
echo  Press Ctrl+C to stop.
echo.

pushd "%BACKEND%"
node server.js
popd
pause
