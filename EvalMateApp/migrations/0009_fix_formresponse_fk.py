"""
Fix foreign key constraint on FormResponse table
The constraint is pointing to the wrong table name (evaluationform instead of formtemplate)
"""

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('EvalMateApp', '0008_draftresponse'),  # Adjust this to your latest migration
    ]

    operations = [
        migrations.RunSQL(
            # Drop the incorrect constraint
            sql="""
                ALTER TABLE "EvalMateApp_formresponse" 
                DROP CONSTRAINT IF EXISTS "EvalMateApp_formresp_form_id_39edb521_fk_EvalMateA";
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            # Add the correct constraint pointing to formtemplate
            sql="""
                ALTER TABLE "EvalMateApp_formresponse"
                ADD CONSTRAINT "EvalMateApp_formresp_form_id_fk_formtemplate"
                FOREIGN KEY (form_id) 
                REFERENCES "EvalMateApp_formtemplate"(id) 
                DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
