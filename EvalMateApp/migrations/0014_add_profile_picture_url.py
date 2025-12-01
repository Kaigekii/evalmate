from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('EvalMateApp', '0013_add_profile_personal_academic_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='profile_picture_url',
            field=models.URLField(max_length=500, null=True, blank=True),
        ),
    ]