@echo off
chcp 65001 >nul
rem Starts the TIME RUSH game on this laptop: http://localhost:5173/host
cd /d "%~dp0time-rush"
if not exist node_modules (
  echo Installing packages, this happens only once...
  call npm install || goto :error
)
if not exist dist\server\index.js (
  echo Building the game, this happens only once...
  call npm run build || goto :error
)
set PORT=5173
echo TIME RUSH is running. Keep this window open during the game.
node dist\server\index.js
pause
exit /b
:error
echo Something went wrong. Is Node.js installed? https://nodejs.org
pause
