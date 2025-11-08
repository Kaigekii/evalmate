from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    account_type = models.CharField(max_length=10, choices=[('student', 'Student'), ('faculty', 'Faculty')], db_index=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField()
    student_id = models.CharField(max_length=20, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    institution = models.CharField(max_length=100, db_index=True)
    department = models.CharField(max_length=100)
    
    # Email verification fields
    email_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_code_created = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['account_type', 'institution']),
        ]

    def __str__(self):
        return f'{self.user.username} Profile'


class FormTemplate(models.Model):
    PRIVACY_CHOICES = [
        ('private', 'Draft (Not Published)'),
        ('institution', 'Same Institution'),
        ('institution_course', 'Same Institution and Course'),
    ]

    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    course_id = models.CharField(max_length=50, blank=True, db_index=True)
    institution = models.CharField(max_length=200, blank=True, db_index=True)
    structure = models.JSONField(default=dict)  # stores questions/fields created by the form builder
    created_by = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='forms')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    privacy = models.CharField(max_length=30, choices=PRIVACY_CHOICES, default='private')
    passcode = models.CharField(max_length=50, blank=True, null=True)
    
    @property
    def is_published(self):
        """Check if form is published (not a draft)"""
        return self.privacy != 'private'

    class Meta:
        indexes = [
            models.Index(fields=['institution', 'privacy']),
            models.Index(fields=['created_by', '-created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.course_id})'
    
    @property
    def due_date(self):
        """Extract due date from structure settings"""
        if self.structure and 'settings' in self.structure:
            due_date_str = self.structure['settings'].get('dueDate')
            if due_date_str:
                try:
                    from datetime import datetime
                    from django.utils import timezone
                    dt = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                    # Ensure timezone aware
                    if dt.tzinfo is None:
                        dt = timezone.make_aware(dt)
                    return dt
                except:
                    return None
        return None
    
    @property
    def team_name(self):
        """Extract team name from structure settings"""
        if self.structure and 'settings' in self.structure:
            return self.structure['settings'].get('teamName', '')
        return ''


class FormResponse(models.Model):
    form = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='responses')
    submitted_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)  # Automatically updates on save
    is_read = models.BooleanField(default=False, db_index=True)
    is_draft = models.BooleanField(default=False)  # Whether this is a draft or final submission
    
    # New fields for team-based peer evaluation
    team_identifier = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    teammate_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['form', '-submitted_at']),
            models.Index(fields=['is_read', 'form']),
            models.Index(fields=['team_identifier']),
        ]
        ordering = ['-submitted_at']

    def __str__(self):
        who = self.submitted_by.user.username if self.submitted_by else 'Anonymous'
        if self.teammate_name:
            return f'Response to {self.form.title} by {who} for {self.teammate_name} at {self.submitted_at}'
        return f'Response to {self.form.title} by {who} at {self.submitted_at}'


class ResponseAnswer(models.Model):
    response = models.ForeignKey(FormResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.TextField()
    answer = models.TextField(blank=True)

    def __str__(self):
        return f'Answer to "{self.question[:40]}"'


class DraftResponse(models.Model):
    """Stores draft responses for evaluations in progress"""
    student = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='draft_responses')
    form = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='draft_responses')
    draft_data = models.JSONField(default=dict)  # Stores partial answers
    team_identifier = models.CharField(max_length=255, blank=True, null=True)
    teammate_name = models.CharField(max_length=255, blank=True, null=True)
    last_saved = models.DateTimeField(auto_now=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'form', 'team_identifier', 'teammate_name']
        indexes = [
            models.Index(fields=['student', '-last_saved']),
        ]
        ordering = ['-last_saved']
    
    def __str__(self):
        return f'Draft: {self.student.user.username} - {self.form.title}'


class PendingEvaluation(models.Model):
    """Tracks forms that students have accessed but not yet completed"""
    student = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='pending_evaluations')
    form = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='pending_students')
    added_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        unique_together = ['student', 'form']
        indexes = [
            models.Index(fields=['student', '-added_at']),
        ]
        ordering = ['-added_at']
    
    def __str__(self):
        return f'{self.student.user.username} - {self.form.title} (Pending)'
    
    @property
    def days_left(self):
        """Calculate days remaining until deadline"""
        due_date = self.form.due_date
        if due_date:
            from django.utils import timezone as tz
            now = tz.now()
            # Ensure due_date is timezone aware
            if due_date.tzinfo is None:
                due_date = tz.make_aware(due_date)
            delta = due_date - now
            return max(0, delta.days)
        return None
    
    @property
    def status(self):
        """Determine evaluation status: urgent, in_progress, or not_started"""
        days = self.days_left
        # Check if there's a draft
        has_draft = DraftResponse.objects.filter(student=self.student, form=self.form).exists()
        
        if has_draft:
            return 'in_progress'
        elif days is not None and days <= 3:
            return 'urgent'
        else:
            return 'not_started'
    
    @property
    def has_draft(self):
        """Check if student has saved a draft for this evaluation"""
        return DraftResponse.objects.filter(student=self.student, form=self.form).exists()

