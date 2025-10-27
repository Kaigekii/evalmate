import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EvalMate.settings')
django.setup()

from EvalMateApp.models import FormTemplate, Profile

print("=== DEBUG REPORT ===\n")

# Check forms
forms = FormTemplate.objects.all()
print(f"Total forms in database: {forms.count()}\n")

for f in forms:
    print(f"Form ID: {f.id}")
    print(f"Title: {f.title}")
    print(f"Course ID: {f.course_id}")
    print(f"Created by: {f.created_by.user.username} (Profile ID: {f.created_by.id})")
    print(f"Institution: {f.created_by.institution}")
    print(f"Privacy: {f.privacy}")
    print(f"Created at: {f.created_at}")
    print()

# Check faculty profiles
print("\nAll faculty profiles:")
faculty = Profile.objects.filter(account_type='faculty')
print(f"Total faculty: {faculty.count()}\n")

for p in faculty:
    print(f"Username: {p.user.username}")
    print(f"Profile ID: {p.id}")
    print(f"Name: {p.first_name} {p.last_name}")
    print(f"Institution: {p.institution}")
    print(f"Forms created: {FormTemplate.objects.filter(created_by=p).count()}")
    print()
