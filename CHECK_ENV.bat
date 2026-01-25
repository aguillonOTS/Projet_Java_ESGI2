@echo off
setlocal enabledelayedexpansion
title DIAGNOSTIC JAVA AVANCE (VERSION 2.0)
cls

echo ==================================================
echo      DIAGNOSTIC ENVIRONNEMENT (JAVA 21+)
echo ==================================================
echo.

:: 1. VERIFICATION DE LA PRESENCE DE JAVA
where java >nul 2>nul
if %errorlevel% neq 0 (
    goto :ERROR_NOT_FOUND
)

:: 2. EXTRACTION DE LA VERSION
:: On recupere la sortie de "java -version" (qui est souvent sur le flux d'erreur 2>&1)
:: On isole la chaine entre guillemets (ex: "1.8.0_481" ou "21.0.1")
set "FULL_VERSION="
for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set "FULL_VERSION=%%g"
)

:: Nettoyage des guillemets
set "FULL_VERSION=!FULL_VERSION:"=!"

:: 3. ANALYSE DU NUMERO DE VERSION
:: Cas Java ancien (1.8, 1.7...) -> On prend le chiffre apres "1."
:: Cas Java moderne (17, 21, 23...) -> On prend le premier chiffre
for /f "tokens=1,2 delims=." %%a in ("!FULL_VERSION!") do (
    if "%%a"=="1" (
        set "MAJOR_VERSION=%%b"
    ) else (
        set "MAJOR_VERSION=%%a"
    )
)

echo [INFO] Version detectee : Java !MAJOR_VERSION! (!FULL_VERSION!)
echo.

:: 4. COMPARAISON AVEC LE MINIMUM REQUIS (21)
if !MAJOR_VERSION! LSS 21 (
    goto :ERROR_TOO_OLD
)

:: ==================================================
:: SUCCES - JAVA 21+ EST LA
:: ==================================================
color 0A
echo [SUCCES] Votre version est compatible !
echo.
echo Vous pouvez lancer START_PIZZERIA.bat.
echo.
pause
exit /b 0

:: ==================================================
:: ERREUR - VERSION TROP VIEILLE
:: ==================================================
:ERROR_TOO_OLD
color 0C
echo [ERREUR] Version de Java obsolete !
echo.
echo Version actuelle : Java !MAJOR_VERSION!
echo Version requise  : Java 21 (ou plus)
echo.
echo Votre Java 8 (1.8) ne peut pas faire tourner ce projet moderne.
echo.
echo SOLUTION :
echo Lancez le script "INSTALL_DEV_ENV.bat" en Administrateur
echo pour mettre a jour Java automatiquement.
echo.
pause
exit /b 1

:: ==================================================
:: ERREUR - PAS DE JAVA DU TOUT
:: ==================================================
:ERROR_NOT_FOUND
color 0C
echo [ERREUR] Java n'est pas detecte.
echo.
echo Verifiez que Java est installe et ajoute au PATH.
echo.
echo SOLUTION :
echo Lancez le script "INSTALL_DEV_ENV.bat" en Administrateur.
echo.
pause
exit /b 1