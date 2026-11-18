@echo off
REM ===========================================================================
REM  CAPINOA - Copia de seguridad
REM ===========================================================================
REM  Guarda una copia de todos tus datos (pacientes, historias, fotos, turnos
REM  y cuentas) en la carpeta "respaldos".
REM
REM  Hacelo una vez por semana y copia el resultado a un pendrive o a la nube.
REM ===========================================================================
cd /d "%~dp0"
title CAPINOA - copia de seguridad
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0herramientas\respaldar.ps1"
