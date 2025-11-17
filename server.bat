@echo off
echo Starting local web server...
echo.
echo The game will open in your browser at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python server.py

if errorlevel 1 (
    echo.
    echo Python not found! Trying alternative methods...
    echo.
    echo Option 1: Install Python from https://www.python.org/
    echo Option 2: Use Node.js: npx http-server
    echo Option 3: Use PHP: php -S localhost:8000
    pause
)

