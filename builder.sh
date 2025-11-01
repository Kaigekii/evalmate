#!/bin/bash

# Exit on any error
set -e

echo "Starting Django deployment build..."

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run any additional build steps here
echo "Build completed successfully!"

# Optional: Run tests before deployment
# echo "Running tests..."
# python manage.py test

echo "Ready for deployment."