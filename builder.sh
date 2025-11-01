#!/bin/bash

# Exit on any error
set -e

echo "Starting Django deployment build..."

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Skip database migrations during build for Supabase
echo "Skipping database migrations during build for Supabase compatibility"
echo "Migrations will be run automatically on application startup"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run any additional build steps here
echo "Build completed successfully!"

# Optional: Run tests before deployment
# echo "Running tests..."
# python manage.py test

echo "Ready for deployment."

# Set Django settings module for gunicorn
export DJANGO_SETTINGS_MODULE=EvalMate.EvalMate.settings