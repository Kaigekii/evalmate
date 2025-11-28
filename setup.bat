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

REM Install/Update requirements with resilient options
echo [3/4] Installing/Updating dependencies...
set PIP_DEFAULT_TIMEOUT=300
python -m pip install --upgrade pip setuptools wheel
if errorlevel 1 (
    echo [WARN] Failed to upgrade pip/setuptools/wheel. Continuing...
)

echo [INFO] Attempting primary install...
pip install --default-timeout 300 -r requirements.txt
if errorlevel 1 (
    echo [WARN] Primary install failed. Retrying with no cache and PyPI simple index...
    pip install --no-cache-dir --default-timeout 300 -i https://pypi.org/simple -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies after retry!
        pause
        exit /b 1
    )
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
