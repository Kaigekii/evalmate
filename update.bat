@echo off
REM Update dependencies script

echo ========================================
echo Updating Dependencies
echo ========================================
echo.

REM Activate virtual environment
call ..\venv\Scripts\activate.bat

REM Update pip
echo [1/2] Updating pip...
python -m pip install --upgrade pip

REM Install/Update requirements
echo [2/2] Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo [SUCCESS] Dependencies updated!
echo.

deactivate
pause
