@echo off
REM Open Django shell with virtual environment activated

echo ========================================
echo Django Shell
echo ========================================
echo.

REM Activate virtual environment
call ..\venv\Scripts\activate.bat

REM Open Django shell
python manage.py shell

deactivate
