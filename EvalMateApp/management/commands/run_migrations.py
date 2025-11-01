from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
import time
import logging
import os

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Run migrations with retry logic for Supabase connections'

    def handle(self, *args, **options):
        # Skip if not in production
        if 'RENDER' not in os.environ:
            self.stdout.write('Skipping migrations - not in production environment')
            return

        max_retries = 10  # Increased retries for reliable connection
        retry_delay = 5  # seconds

        for attempt in range(max_retries):
            try:
                self.stdout.write(f'Attempting database connection (attempt {attempt + 1}/{max_retries})...')

                # Test connection
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    if result:
                        self.stdout.write(self.style.SUCCESS('Database connection successful'))

                # Run migrations
                self.stdout.write('Running database migrations...')
                call_command('migrate', verbosity=1, interactive=False)
                self.stdout.write(self.style.SUCCESS('Migrations completed successfully'))
                return

            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Attempt {attempt + 1} failed: {str(e)}'))

                if attempt < max_retries - 1:
                    self.stdout.write(f'Waiting {retry_delay} seconds before retry...')
                    time.sleep(retry_delay)
                    retry_delay = min(retry_delay * 1.5, 30)  # Gradual increase, max 30s
                else:
                    self.stdout.write(self.style.ERROR('All database connection attempts failed. Deployment cannot continue.'))
                    raise Exception('Database connection failed after all retries')