@echo off
setlocal
title INSTALLATION ENVIRONNEMENT DEVELOPPEMENT (PIZZERIA)
color 0B

echo ==================================================
echo      SETUP AUTOMATIQUE DES OUTILS (DEV)
echo ==================================================
echo Ce script va tenter d'installer les outils manquants
echo via le gestionnaire de paquets Windows (Winget).
echo.
echo [IMPORTANT] Lancez ce script en tant qu'ADMINISTRATEUR
echo (Clic droit > Executer en tant qu'administrateur)
echo.
pause

:: 1. VERIFICATION DE WINGET
where winget >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERREUR] Winget n'est pas installe sur ce PC.
    echo Vous devez installer Java et Node.js manuellement.
    echo.
    echo Liens :
    echo - Java 21 : https://adoptium.net/
    echo - Node.js : https://nodejs.org/
    pause
    exit /b 1
)

:: 2. INSTALLATION JAVA 21 (Si manquant)
echo.
echo [1/2] Verification de Java...
where java >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Java est deja installe.
) else (
    echo [MANQUANT] Installation de Java 21 (Eclipse Temurin)...
    echo.
    winget install -e --id EclipseAdoptium.Temurin.21
    echo.
    echo [INFO] Java installe.
)

:: 3. INSTALLATION NODE.JS (Si manquant)
echo.
echo [2/2] Verification de Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js est deja installe.
) else (
    echo [MANQUANT] Installation de Node.js (LTS)...
    echo.
    winget install -e --id OpenJS.NodeJS.LTS
    echo.
    echo [INFO] Node.js installe.
)

echo.
echo ==================================================
echo      INSTALLATION TERMINEE
echo ==================================================
echo.
echo [TRES IMPORTANT]
echo Vous devez REDEMARRER votre PC ou fermer toutes
echo les fenetres de terminal pour que les changements
echo soient pris en compte.
echo.
pause