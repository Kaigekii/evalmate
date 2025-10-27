from EvalMateApp.models import Profile
from django.contrib.auth.models import User

# Find f4culty user
try:
    user = User.objects.get(username='f4culty')
    profile = user.profile
    
    print(f"Username: {user.username}")
    print(f"Account Type: {profile.account_type}")
    print(f"Name: {profile.first_name} {profile.last_name}")
    print(f"Email: {profile.email}")
    print(f"Institution: {profile.institution}")
    print(f"Department: {profile.department}")
    print(f"Student ID: {profile.student_id if profile.student_id else 'N/A'}")
except User.DoesNotExist:
    print("User 'f4culty' not found")
