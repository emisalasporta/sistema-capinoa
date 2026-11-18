@echo off
REM ===========================================================================
REM  CAPINOA - Sistema de gestion
REM  Doble clic aca para abrir el sistema.
REM ===========================================================================
REM  Esto enciende el sistema en esta computadora y abre el navegador solo.
REM  MIENTRAS EL SISTEMA ESTE ABIERTO, ESTA VENTANA NEGRA TIENE QUE QUEDAR
REM  ABIERTA. Si se cierra, el sistema se apaga (los datos no se pierden).
REM ===========================================================================

setlocal
cd /d "%~dp0"
title CAPINOA - sistema encendido (no cerrar esta ventana)
cls

echo.
echo   ============================================
echo     CAPINOA - Sistema de gestion
echo   ============================================
echo.

REM --- Si ya hay una copia encendida, no intentamos encender otra: -----------
REM     el sistema usa la "puerta" 8090 de la computadora y solo puede haber
REM     una a la vez. En vez de mostrar un error incomprensible, abrimos el
REM     navegador, que es lo que la persona queria hacer.
netstat -an | findstr "127.0.0.1:8090" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto yaEncendido

echo   Encendiendo... en unos segundos se abre solo
echo   el navegador con el sistema.
echo.
echo   NO CIERRES ESTA VENTANA mientras lo uses.
echo.

start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:8090"

pocketbase.exe serve --http=127.0.0.1:8090
set CODIGO=%errorlevel%

echo.
if not "%CODIGO%"=="0" goto huboError
echo   El sistema se apago. Podes cerrar esta ventana.
pause
exit /b 0

:yaEncendido
echo   El sistema YA ESTABA ENCENDIDO.
echo   Te abro el navegador y listo.
echo.
echo   (Si lo que querias era reiniciarlo: cerra primero la
echo    OTRA ventana negra de CAPINOA que quedo abierta, y
echo    despues volve a hacer doble clic aca.)
echo.
start "" http://127.0.0.1:8090
echo   Esta ventana ya la podes cerrar.
pause
exit /b 0

:huboError
echo   *** El sistema no pudo encenderse. ***
echo.
echo   Sacale una foto a este mensaje y mandasela a Emiliano.
echo.
pause
exit /b 1
