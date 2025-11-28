from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import ValidationError
from .models import Profile

class UserRegisterForm(UserCreationForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
    
    def clean_email(self):
        """Validate that email ends with @gmail.com"""
        email = self.cleaned_data.get('email')
        if email and not email.lower().endswith('@gmail.com'):
            raise ValidationError('Please use a Gmail address (@gmail.com) to register.')
        return email

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['account_type', 'first_name', 'last_name', 'email', 'student_id', 'phone_number', 'institution', 'department']
    
    def clean_email(self):
        """Validate that email ends with @gmail.com"""
        email = self.cleaned_data.get('email')
        if email and not email.lower().endswith('@gmail.com'):
            raise ValidationError('Please use a Gmail address (@gmail.com) to register.')
        return email