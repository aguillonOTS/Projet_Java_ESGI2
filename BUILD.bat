@echo off
setlocal enabledelayedexpansion
title BUILD - Pizzeria ESGI
color 0B

echo ==================================================
echo      BUILD COMPLET - Pizzeria ESGI
echo      Frontend (React) + Backend (Java)
echo ==================================================
echo.

:: ---- Verification Java ----
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Java introuvable. Lancez CHECK_ENV.bat d'abord.
    pause & exit /b 1
)

:: ---- Verification Node / npm ----
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js / npm introuvable.
    echo Telechargez-le sur https://nodejs.org
    pause & exit /b 1
)

:: =============================================
:: ETAPE 1 : FRONTEND
:: =============================================
echo [1/3] Installation des dependances npm...
cd /d "%~dp0Frontend"
call npm install
if %errorlevel% neq 0 (
    echo [ERREUR] npm install a echoue.
    pause & exit /b 1
)

echo.
echo [2/3] Build du frontend React...
call npm run build
if %errorlevel% neq 0 (
    echo [ERREUR] npm run build a echoue.
    pause & exit /b 1
)
echo [OK] Frontend compile dans Backend/src/main/resources/static/

:: =============================================
:: ETAPE 2 : TELECHARGER MAVEN SI ABSENT
:: =============================================
set "MAVEN_VERSION=3.9.9"
set "MAVEN_DIR=%~dp0.build\apache-maven-%MAVEN_VERSION%"
set "MVN=%MAVEN_DIR%\bin\mvn.cmd"

if not exist "%MVN%" (
    echo.
    echo [INFO] Maven non installe. Telechargement en cours (~10 Mo)...
    if not exist "%~dp0.build" mkdir "%~dp0.build"
    set "MAVEN_URL=https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip"
    set "MAVEN_ZIP=%~dp0.build\maven.zip"
    powershell -NoProfile -Command "Invoke-WebRequest -Uri '!MAVEN_URL!' -OutFile '!MAVEN_ZIP!' -UseBasicParsing"
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec du telechargement Maven. Verifiez votre connexion.
        pause & exit /b 1
    )
    powershell -NoProfile -Command "Expand-Archive -Path '!MAVEN_ZIP!' -DestinationPath '%~dp0.build' -Force"
    del "!MAVEN_ZIP!"
    echo [OK] Maven %MAVEN_VERSION% pret.
)

:: =============================================
:: ETAPE 3 : BACKEND
:: =============================================
echo.
echo [3/3] Compilation du backend Java...
cd /d "%~dp0Backend"
call "%MVN%" clean package -DskipTests
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] La compilation Java a echoue. Consultez les logs ci-dessus.
    pause & exit /b 1
)

:: Copie du JAR
for %%f in ("target\*.jar") do (
    copy /y "%%f" "%~dp0app.jar" >nul
    echo [OK] app.jar mis a jour (%%~nxf)
    goto :done
)
:done

echo.
echo ==================================================
echo  Build termine avec succes !
echo  Lancez START_PIZZERIA.bat pour demarrer.
echo ==================================================
echo.
pause
