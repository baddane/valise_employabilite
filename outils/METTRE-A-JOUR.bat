@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo Mise a jour du contenu de la valise...
node outils\generer-contenu.js
if errorlevel 1 (
  echo.
  echo ERREUR : Node.js est requis ^(https://nodejs.org^).
)
echo.
pause
