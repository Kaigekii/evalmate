from django.shortcuts import render, redirect

def home_view(request):
    return redirect('login')

def login_view(request):
    return render(request, 'EvalMateApp/login.html')

def register_view(request):
    return render(request, 'EvalMateApp/register.html')
