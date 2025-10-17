from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import UserRegisterForm, ProfileForm

def home_view(request):
    """Redirect authenticated users to their appropriate dashboard"""
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            # Redirect to appropriate dashboard based on account type
            if profile.account_type == 'student':
                return redirect('student_dashboard')
            elif profile.account_type == 'faculty':
                return redirect('faculty_dashboard')
            else:
                # If account type is not recognized, log them out and show error
                logout(request)
                messages.error(request, 'Invalid account type. Please contact support.')
                return redirect('login')
        except:
            # If profile doesn't exist, log them out and show error
            logout(request)
            messages.error(request, 'Profile not found. Please contact support.')
            return redirect('login')
    return redirect('login')

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            try:
                # Check if profile exists
                profile = user.profile
                
                # Log the user in
                login(request, user)
                messages.success(request, f'Welcome back, {user.username}!')
                
                # Redirect based on account type
                if profile.account_type == 'student':
                    return redirect('student_dashboard')
                elif profile.account_type == 'faculty':
                    return redirect('faculty_dashboard')  # You'll need to create this
                else:
                    return redirect('home')
                    
            except Exception as e:
                messages.error(request, f'Profile not found: {str(e)}')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AuthenticationForm()
    return render(request, 'EvalMateApp/login.html', {'form': form})

def register_view(request):
    if request.method == 'POST':
        user_form = UserRegisterForm(request.POST)
        profile_form = ProfileForm(request.POST)
        if user_form.is_valid() and profile_form.is_valid():
            try:
                user = user_form.save()
                profile = profile_form.save(commit=False)
                profile.user = user
                profile.save()
                
                # Log the user in
                login(request, user)
                messages.success(request, f'Account created for {user.username}!')
                
                # Redirect based on account type
                if profile.account_type == 'student':
                    return redirect('student_dashboard')
                elif profile.account_type == 'faculty':
                    return redirect('faculty_dashboard')  # You'll need to create this
                else:
                    return redirect('home')
                    
            except Exception as e:
                messages.error(request, f'Failed to save to database: {str(e)}. Please try again.')
        else:
            messages.error(request, 'Registration failed. Please check the form.')
    else:
        user_form = UserRegisterForm()
        profile_form = ProfileForm()
    return render(request, 'EvalMateApp/register.html', {'user_form': user_form, 'profile_form': profile_form})

def logout_view(request):
    logout(request)
    messages.info(request, 'You have been logged out.')
    return redirect('login')

def student_dashboard_view(request):
    """Student Dashboard - Single Page Application (SPA)"""
    if not request.user.is_authenticated:
        return redirect('login')
    
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            messages.error(request, 'Access denied. Students only.')
            return redirect('home')
    except:
        messages.error(request, 'Profile not found.')
        return redirect('login')
    
    context = {
        'user': request.user,
        'profile': profile
    }
    return render(request, 'EvalMateApp/student-overview.html', context)

def faculty_dashboard_view(request):
    """Faculty dashboard view"""
    if not request.user.is_authenticated:
        return redirect('login')
    
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            messages.error(request, 'Access denied. Faculty only.')
            return redirect('home')
    except:
        messages.error(request, 'Profile not found.')
        return redirect('login')
    
    context = {
        'user': request.user,
        'profile': profile,
    }
    return render(request, 'EvalMateApp/faculty-dashboard.html', context)

@login_required
def form_builder_view(request):
    """Form builder view for faculty members"""
    messages.info(request, 'Accessing form builder view')  # Debug message
    
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            messages.error(request, 'Access denied. Faculty only.')
            return redirect('home')
        messages.success(request, 'Faculty access verified')  # Debug message
    except Exception as e:
        messages.error(request, f'Profile not found: {str(e)}')
        return redirect('login')
    
    context = {
        'user': request.user,
        'profile': profile,
    }
    messages.info(request, 'Rendering form builder template')  # Debug message
    return render(request, 'EvalMateApp/form-builder.html', context)
