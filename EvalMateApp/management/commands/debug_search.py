from django.core.management.base import BaseCommand
from django.db import connection
from EvalMateApp.models import Profile, FormTemplate


class Command(BaseCommand):
    help = 'Debugs student form search issue'

    def handle(self, *args, **options):
        self.stdout.write('=' * 60)
        self.stdout.write('DEBUGGING STUDENT FORM SEARCH')
        self.stdout.write('=' * 60)
        
        # Check all forms
        self.stdout.write('\n📋 All Forms in Database:')
        forms = FormTemplate.objects.all()
        if forms.count() == 0:
            self.stdout.write(self.style.WARNING('  No forms found!'))
        else:
            for f in forms:
                self.stdout.write(f'\n  Form ID: {f.id}')
                self.stdout.write(f'    Title: {f.title}')
                self.stdout.write(f'    Course ID: {f.course_id}')
                self.stdout.write(f'    Institution: "{f.institution}"')
                self.stdout.write(f'    Privacy: {f.privacy}')
                self.stdout.write(f'    Passcode: {"Yes" if f.passcode else "No"}')
                self.stdout.write(f'    Created by: {f.created_by.user.username} ({f.created_by.institution})')
        
        # Check all student profiles
        self.stdout.write('\n\n👨‍🎓 All Student Profiles:')
        students = Profile.objects.filter(account_type='student')
        if students.count() == 0:
            self.stdout.write(self.style.WARNING('  No students found!'))
        else:
            for s in students:
                self.stdout.write(f'\n  Student: {s.user.username}')
                self.stdout.write(f'    Name: {s.first_name} {s.last_name}')
                self.stdout.write(f'    Institution: "{s.institution}"')
                self.stdout.write(f'    Department: {s.department}')
        
        # Check faculty profiles
        self.stdout.write('\n\n👨‍🏫 All Faculty Profiles:')
        faculty = Profile.objects.filter(account_type='faculty')
        if faculty.count() == 0:
            self.stdout.write(self.style.WARNING('  No faculty found!'))
        else:
            for f in faculty:
                self.stdout.write(f'\n  Faculty: {f.user.username}')
                self.stdout.write(f'    Name: {f.first_name} {f.last_name}')
                self.stdout.write(f'    Institution: "{f.institution}"')
                self.stdout.write(f'    Department: {f.department}')
        
        # Match check
        self.stdout.write('\n\n🔍 Institution Match Analysis:')
        for student in students:
            self.stdout.write(f'\n  Student "{student.user.username}" (Institution: "{student.institution}"):')
            matching_forms = []
            for form in forms:
                if form.privacy == 'institution' and form.institution == student.institution:
                    matching_forms.append(form)
            
            if matching_forms:
                self.stdout.write(self.style.SUCCESS(f'    ✅ Can see {len(matching_forms)} form(s):'))
                for form in matching_forms:
                    self.stdout.write(f'       - {form.title} (Course: {form.course_id})')
            else:
                self.stdout.write(self.style.WARNING(f'    ❌ No matching forms'))
                self.stdout.write(f'       Form institutions: {[f.institution for f in forms]}')
                self.stdout.write(f'       Student institution: "{student.institution}"')
                
                # Check for near matches
                for form in forms:
                    if student.institution.lower() in form.institution.lower() or form.institution.lower() in student.institution.lower():
                        self.stdout.write(self.style.WARNING(f'       ⚠ Near match: "{form.institution}" vs "{student.institution}"'))
        
        self.stdout.write('\n' + '=' * 60)
