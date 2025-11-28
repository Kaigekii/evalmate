@echo off
REM Setup script for EvalMate Django project - Run this ONCE

echo ========================================
echo EvalMate Project Setup
echo ========================================
echo.

REM Create virtual environment if it doesn't exist
if exist "..\venv" (
    echo [INFO] Virtual environment already exists, skipping creation...
) else (
    echo [1/4] Creating virtual environment...
    python -m venv ..\venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created!
)

REM Activate virtual environment
echo [2/4] Activating virtual environment...
call ..\venv\Scripts\activate.bat

REM Install/Update requirements
echo [3/4] Installing/Updating dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

REM Run migrations
echo [4/4] Running database migrations...
python manage.py migrate
if errorlevel 1 (
    echo [ERROR] Failed to run migrations!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the development server, run: run.bat
echo.

deactivate
pause
