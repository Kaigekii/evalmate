from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    account_type = models.CharField(max_length=10, choices=[('student', 'Student'), ('faculty', 'Faculty')])
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField()
    student_id = models.CharField(max_length=20, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    institution = models.CharField(max_length=100)
    department = models.CharField(max_length=100)

    def __str__(self):
        return f'{self.user.username} Profile'


class FormTemplate(models.Model):
    PRIVACY_CHOICES = [
        ('institution', 'Same Institution'),
        ('institution_course', 'Same Institution and Course'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course_id = models.CharField(max_length=50, blank=True)
    institution = models.CharField(max_length=200, blank=True)
    structure = models.JSONField(default=dict)  # stores questions/fields created by the form builder
    created_by = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='forms')
    created_at = models.DateTimeField(auto_now_add=True)
    privacy = models.CharField(max_length=30, choices=PRIVACY_CHOICES, default='institution')
    passcode = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f'{self.title} ({self.course_id})'


class FormResponse(models.Model):
    form = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='responses')
    submitted_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        who = self.submitted_by.user.username if self.submitted_by else 'Anonymous'
        return f'Response to {self.form.title} by {who} at {self.submitted_at}'


class ResponseAnswer(models.Model):
    response = models.ForeignKey(FormResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.TextField()
    answer = models.TextField(blank=True)

    def __str__(self):
        return f'Answer to "{self.question[:40]}"'
