@echo off
REM Quick migration script for EvalMate

echo ========================================
echo Running Database Migrations
echo ========================================
echo.

REM Activate virtual environment
call ..\venv\Scripts\activate.bat

REM Make migrations
echo [1/2] Creating migrations...
python manage.py makemigrations

REM Apply migrations
echo [2/2] Applying migrations...
python manage.py migrate

echo.
echo [SUCCESS] Migrations complete!
echo.

deactivate
pause
