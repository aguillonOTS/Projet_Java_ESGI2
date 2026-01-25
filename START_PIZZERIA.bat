@echo off
title PIZZERIA ESGI - LANCEMENT
color 0A

echo ==================================================
echo      DEMARRAGE DU PROJET PIZZERIA
echo ==================================================
echo.
echo Le navigateur va s'ouvrir dans quelques secondes...
echo.

:: Ouvre le navigateur après 5 secondes
start /min cmd /c "timeout /t 5 >nul && start http://localhost:8080"

:: Lance l'application (le fichier app.jar situé au même endroit)
java -jar app.jar

pause