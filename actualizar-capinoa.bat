@echo off
REM ===========================================================================
REM  CAPINOA - Actualizar el sistema
REM ===========================================================================
REM  Aplica la actualizacion que mando Emiliano SIN tocar tus datos.
REM
REM  Antes de hacer doble clic aca:
REM    1. Cerra CAPINOA (la ventana negra).
REM    2. Guarda el archivo .zip dentro de la carpeta "actualizaciones".
REM ===========================================================================
cd /d "%~dp0"
title CAPINOA - actualizar
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0herramientas\actualizar.ps1"
