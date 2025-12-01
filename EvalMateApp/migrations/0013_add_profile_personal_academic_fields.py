from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('EvalMateApp', '0012_add_profile_picture'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='major',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='academic_year',
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='expected_graduation',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='current_gpa',
            field=models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True),
        ),
    ]
