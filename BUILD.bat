@echo off
setlocal enabledelayedexpansion
title BUILD - Pizzeria ESGI
color 0B

echo ==================================================
echo      BUILD COMPLET - Pizzeria ESGI
echo ==================================================
echo.

:: ---- Verification Java ----
where java >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERREUR] Java introuvable. Installez Java 21+.
    pause & exit /b 1
)

:: ---- Verification Node / npm ----
where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERREUR] Node.js introuvable. Telechargez sur https://nodejs.org
    pause & exit /b 1
)

:: ---- Arret du serveur si port 8080 occupe ----
netstat -ano 2>nul | findstr ":8080 " | findstr "LISTENING" >nul 2>nul
if %errorlevel% == 0 (
    echo [INFO] Port 8080 occupe - arret du serveur...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080 " ^| findstr "LISTENING"') do (
        taskkill /PID %%p /F >nul 2>nul
    )
    timeout /t 2 >nul
    echo [OK] Serveur arrete.
    echo.
)

:: =============================================
:: ETAPE 1/3 : npm install
:: =============================================
echo [1/3] Installation des dependances npm...
cd /d "%~dp0Frontend"

call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    color 0C
    echo [ERREUR] npm install a echoue.
    pause & exit /b 1
)
echo [OK] Dependances installees.
echo.

:: =============================================
:: ETAPE 2/3 : npm run build
:: =============================================
echo [2/3] Build du frontend React...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERREUR] La compilation React a echoue.
    echo Verifiez les erreurs ci-dessus.
    pause & exit /b 1
)
echo [OK] Frontend compile.
echo.

:: =============================================
:: Telechargement Maven si absent
:: =============================================
set "MAVEN_VERSION=3.9.9"
set "MAVEN_DIR=%~dp0.build\apache-maven-%MAVEN_VERSION%"
set "MVN=%MAVEN_DIR%\bin\mvn.cmd"

if not exist "%MVN%" (
    echo [INFO] Telechargement de Maven %MAVEN_VERSION% (~10 Mo)...
    if not exist "%~dp0.build" mkdir "%~dp0.build"
    set "MAVEN_URL=https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip"
    set "MAVEN_ZIP=%~dp0.build\maven.zip"
    powershell -NoProfile -Command "Invoke-WebRequest -Uri '!MAVEN_URL!' -OutFile '!MAVEN_ZIP!' -UseBasicParsing"
    if %errorlevel% neq 0 (
        color 0C
        echo [ERREUR] Telechargement Maven impossible.
        pause & exit /b 1
    )
    powershell -NoProfile -Command "Expand-Archive -Path '!MAVEN_ZIP!' -DestinationPath '%~dp0.build' -Force"
    del "!MAVEN_ZIP!"
    echo [OK] Maven pret.
    echo.
)

:: =============================================
:: ETAPE 3/3 : Compilation Java
:: =============================================
echo [3/3] Compilation du backend Java...
cd /d "%~dp0Backend"

call "%MVN%" clean package -DskipTests 2>&1
set MAVEN_RESULT=%errorlevel%

if %MAVEN_RESULT% neq 0 (
    color 0C
    echo.
    echo =====================================================
    echo  [ERREUR] Compilation Java echouee (code %MAVEN_RESULT%).
    echo  Relisez les messages d'erreur ci-dessus.
    echo =====================================================
    pause
    exit /b 1
)
echo [OK] Backend compile.
echo.

:: Copie du JAR final (exclure le .jar.original)
for %%f in ("%~dp0Backend\target\pizzeria-backend-*.jar") do (
    echo %%~nxf | findstr /i "original" >nul || (
        copy /y "%%f" "%~dp0app.jar" >nul
        echo [OK] app.jar mis a jour.
        goto :success
    )
)
echo [WARN] JAR non trouve dans target\, verifiez le build.
pause & exit /b 1

:success
echo.
color 0A
echo ==================================================
echo  BUILD REUSSI !  Lancez START_PIZZERIA.bat
echo ==================================================
echo.
pause
