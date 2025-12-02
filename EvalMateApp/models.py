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
    date_of_birth = models.DateField(blank=True, null=True)
    institution = models.CharField(max_length=100, db_index=True)
    department = models.CharField(max_length=100)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    # Optional public URL when storing in Supabase Storage
    profile_picture_url = models.URLField(max_length=500, blank=True, null=True)
    # Academic fields
    major = models.CharField(max_length=100, blank=True)
    academic_year = models.CharField(max_length=50, blank=True)
    expected_graduation = models.DateField(blank=True, null=True)
    current_gpa = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)

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
        """Extract due date and time from structure settings"""
        if self.structure and 'settings' in self.structure:
            due_date_str = self.structure['settings'].get('dueDate')
            due_time_str = self.structure['settings'].get('dueTime')
            
            if due_date_str:
                try:
                    from datetime import datetime
                    from django.utils import timezone
                    
                    # Clean up the date string - remove any 'Z' or timezone info
                    due_date_clean = due_date_str.replace('Z', '').replace('+00:00', '').split('T')[0]
                    
                    # Combine date and time if both exist
                    if due_time_str and due_time_str.strip():
                        # Parse the date (YYYY-MM-DD format)
                        # Parse the time (HH:MM format in 24-hour)
                        datetime_str = f"{due_date_clean}T{due_time_str}:00"
                        dt = datetime.fromisoformat(datetime_str)
                    else:
                        # If no time specified, try to parse as full ISO format first
                        if 'T' in due_date_str:
                            dt = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                        else:
                            # Just a date, default to midnight
                            datetime_str = f"{due_date_clean}T00:00:00"
                            dt = datetime.fromisoformat(datetime_str)
                    
                    # Ensure timezone aware
                    if dt.tzinfo is None:
                        dt = timezone.make_aware(dt)
                    return dt
                except Exception as e:
                    print(f"Error parsing due_date for form {self.id}: date='{due_date_str}', time='{due_time_str}', error={e}")
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
        """Determine evaluation status: urgent or not_started"""
        days = self.days_left
        
        if days is not None and days <= 3:
            return 'urgent'
        else:
            return 'not_started'

