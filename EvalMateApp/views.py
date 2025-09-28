from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from .forms import UserRegisterForm, ProfileForm

def home_view(request):
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            welcome_message = f'Welcome, {profile.first_name} {profile.last_name}!'
        except:
            welcome_message = f'Welcome, {request.user.username}!'
        return render(request, 'EvalMateApp/home.html', {'message': welcome_message})
    return redirect('login')

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        selected_type = request.POST.get('userType')
        if form.is_valid():
            user = form.get_user()
            try:
                if user.profile.account_type == selected_type:
                    login(request, user)
                    messages.success(request, f'Welcome back, {user.username}!')
                    return redirect('home')
                else:
                    messages.error(request, 'Invalid user type for this account.')
            except:
                messages.error(request, 'Profile not found.')
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
                login(request, user)
                messages.success(request, f'Account created for {user.username}!')
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
