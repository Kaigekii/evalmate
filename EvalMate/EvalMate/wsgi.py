"""
WSGI config for EvalMate project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EvalMate.EvalMate.settings')

# Skip migrations during development runserver
try:
    from django.core.management import execute_from_command_line
    import sys
    import os

    # Only run migrations if we're in production (not during management commands)
    if 'RENDER' in os.environ and (len(sys.argv) == 1 or sys.argv[1] not in ['migrate', 'makemigrations', 'runserver', 'shell', 'dbshell']):
        print("Running database migrations on application startup...")
        try:
            execute_from_command_line(['manage.py', 'run_migrations'])
            print("Migrations completed successfully")
        except Exception as e:
            print(f"Migration failed: {e}")
            print("Application will continue - database may not be ready yet")
except ImportError:
    pass

application = get_wsgi_application()
