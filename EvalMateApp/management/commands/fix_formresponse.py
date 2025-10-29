from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Adds the missing is_read column to FormResponse table'

    def handle(self, *args, **options):
        sql = """
        ALTER TABLE "EvalMateApp_formresponse" 
        ADD COLUMN IF NOT EXISTS "is_read" boolean NOT NULL DEFAULT false;
        """

        with connection.cursor() as cursor:
            cursor.execute(sql)
        
        self.stdout.write(self.style.SUCCESS('✅ Added is_read column to FormResponse table!'))
        self.stdout.write(self.style.SUCCESS('Reports page should now work correctly.'))
