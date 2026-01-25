@echo off
setlocal
title DIAGNOSTIC ENVIRONNEMENT JAVA
cls

:: --- TENTATIVE DE DETECTION ---
echo ==================================================
echo      VERIFICATION DE L'ENVIRONNEMENT JAVA
echo ==================================================
echo.

:: 1. Vérifier si la commande 'java' existe dans le PATH
where java >nul 2>nul
if %errorlevel% neq 0 (
    goto :ERROR_JAVA
)

:: 2. Si Java est trouvé, on affiche la version
color 0A
echo [OK] Java est detecte dans le systeme !
echo.
echo Voici la version installee :
echo --------------------------------------------------
java -version
echo --------------------------------------------------
echo.
echo [CONSEIL] Verifiez que le numero ci-dessus est bien "21" (ou plus).
echo.
echo ==================================================
echo      DIAGNOSTIC : TOUT SEMBLE CORRECT
echo ==================================================
echo Vous devriez pouvoir lancer START_PIZZERIA.bat sans probleme.
pause
exit /b 0

:ERROR_JAVA
color 0C
echo [ERREUR] La commande 'java' n'est pas reconnue.
echo.
echo CAUSES POSSIBLES :
echo 1. Java n'est pas installe sur cet ordinateur.
echo 2. Java est installe, mais l'option "Add to PATH" n'a pas ete cochee.
echo.
echo SOLUTIONS :
echo A. Reinstaller Java 21 (https://jdk.java.net/21/)
echo B. Ajouter manuellement le dossier 'bin' de Java au PATH Windows.
echo.
echo ==================================================
echo      DIAGNOSTIC : ECHEC CRITIQUE
echo ==================================================
pause
exit /b 1