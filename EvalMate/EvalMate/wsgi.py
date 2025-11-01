"""
WSGI config for EvalMate project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EvalMate.EvalMate.settings')

# Run migrations on startup for Supabase
try:
    from django.core.management import execute_from_command_line
    import sys

    # Check if we're not in a management command
    if len(sys.argv) == 1 or sys.argv[1] not in ['migrate', 'makemigrations', 'runserver', 'shell', 'dbshell']:
        print("Running database migrations on application startup...")
        try:
            execute_from_command_line(['manage.py', 'run_migrations'])
        except Exception as e:
            print(f"Migration failed: {e}")
            print("Application will continue without database migrations")
except ImportError:
    pass

application = get_wsgi_application()
