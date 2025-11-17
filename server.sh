#!/bin/bash
# Simple HTTP server for local development
# Run this script to serve the game locally

PORT=8000

echo "Starting local web server..."
echo "The game will open in your browser at http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first
if command -v python3 &> /dev/null; then
    python3 server.py
# Try Python 2
elif command -v python &> /dev/null; then
    python server.py
# Try Node.js http-server
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    npx http-server -p $PORT -o
# Try PHP built-in server
elif command -v php &> /dev/null; then
    echo "Using PHP built-in server..."
    php -S localhost:$PORT
else
    echo "Error: No suitable server found!"
    echo "Please install one of:"
    echo "  - Python 3: https://www.python.org/"
    echo "  - Node.js: https://nodejs.org/"
    echo "  - PHP: https://www.php.net/"
    exit 1
fi

