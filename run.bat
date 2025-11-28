@echo off
REM Quick run script for EvalMate Django project

echo ========================================
echo Starting EvalMate Development Server
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "..\venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup.bat first to create the virtual environment.
    pause
    exit /b 1
)

REM Activate virtual environment
echo [1/2] Activating virtual environment...
call ..\venv\Scripts\activate.bat

REM Run Django development server
echo [2/2] Starting Django server...
echo.
echo Server will start at: http://127.0.0.1:8000
echo Press CTRL+C to stop the server
echo.
python manage.py runserver

REM Deactivate on exit
deactivate
