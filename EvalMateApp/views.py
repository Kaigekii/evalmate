from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import UserRegisterForm, ProfileForm
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q

from .models import FormTemplate, FormResponse, ResponseAnswer

import json
from django.views.decorators.csrf import csrf_exempt


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
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            messages.error(request, 'Access denied. Faculty only.')
            return redirect('home')
    except Exception as e:
        messages.error(request, f'Profile not found: {str(e)}')
        return redirect('login')
    
    context = {
        'user': request.user,
        'profile': profile,
    }
    return render(request, 'EvalMateApp/form-builder.html', context)


@login_required
def faculty_reports_view(request):
    # Only faculty
    profile = request.user.profile
    if profile.account_type != 'faculty':
        return HttpResponseForbidden('Access denied')

    forms = FormTemplate.objects.filter(created_by=profile).order_by('-created_at')
    today = timezone.localdate()
    forms_data = []
    for f in forms:
        total = f.responses.count()
        todays = f.responses.filter(submitted_at__date=today).count()
        unread = f.responses.filter(is_read=False).count()
        forms_data.append({
            'form': f,
            'total_submissions': total,
            'todays_submissions': todays,
            'unread_submissions': unread,
        })

    return render(request, 'EvalMateApp/reports_list.html', {'forms_data': forms_data, 'profile': profile})


@login_required
def faculty_form_responses_view(request, form_id):
    profile = request.user.profile
    if profile.account_type != 'faculty':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id, created_by=profile)
    responses = form.responses.select_related('submitted_by').order_by('-submitted_at')
    return render(request, 'EvalMateApp/reports_form_responses.html', {'form': form, 'responses': responses})


@login_required
def faculty_response_detail_view(request, form_id, response_id):
    profile = request.user.profile
    if profile.account_type != 'faculty':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id, created_by=profile)
    response = get_object_or_404(FormResponse, id=response_id, form=form)
    # mark read
    if not response.is_read:
        response.is_read = True
        response.save()

    answers = response.answers.all()
    return render(request, 'EvalMateApp/reports_response_detail.html', {'form': form, 'response': response, 'answers': answers})


@login_required
def student_search_forms(request):
    # AJAX endpoint returning JSON list of forms the student can see
    profile = request.user.profile
    if profile.account_type != 'student':
        return JsonResponse({'error': 'Access denied'}, status=403)

    q = request.GET.get('q', '').strip()
    qs = FormTemplate.objects.all()
    results = []

    if q:
        # search by course_id or title
        qs = qs.filter(Q(course_id__icontains=q) | Q(title__icontains=q))
    else:
        qs = qs.none()

    # Filter by privacy rules
    visible = []
    for f in qs:
        if f.privacy == 'institution' and f.institution and f.institution == profile.institution:
            visible.append(f)
        elif f.privacy == 'institution_course' and f.institution and f.institution == profile.institution and q and q.lower() in (f.course_id or '').lower():
            visible.append(f)

    for f in visible:
        results.append({
            'id': f.id,
            'title': f.title,
            'course_id': f.course_id,
            'created_at': f.created_at.isoformat(),
            'requires_passcode': bool(f.passcode),
        })

    return JsonResponse({'results': results})


@login_required
def student_form_view(request, form_id):
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)

    # check privacy
    allowed = False
    if form.privacy == 'institution' and form.institution == profile.institution:
        allowed = True
    elif form.privacy == 'institution_course' and form.institution == profile.institution and form.course_id:
        # allow if student matches course? allow view; passcode still enforced
        allowed = True

    if not allowed:
        messages.error(request, 'This form is not available for your institution or course.')
        return redirect('student_dashboard')

    # check passcode stored in session
    access_key = f'form_access_{form.id}'
    has_access = request.session.get(access_key, False)
    if form.passcode and not has_access:
        # show passcode form
        return render(request, 'EvalMateApp/student_form_passcode.html', {'form': form})

    # show form for answering
    return render(request, 'EvalMateApp/student_form_view.html', {'form': form})


@login_required
def student_form_access(request, form_id):
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)
    if request.method != 'POST':
        return redirect('student_form_view', form_id=form.id)

    entered = request.POST.get('passcode', '').strip()
    if form.passcode and entered == form.passcode:
        request.session[f'form_access_{form.id}'] = True
        return redirect('student_form_view', form_id=form.id)
    else:
        messages.error(request, 'Incorrect passcode.')
        return render(request, 'EvalMateApp/student_form_passcode.html', {'form': form})


@login_required
def student_form_submit(request, form_id):
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)
    if request.method != 'POST':
        return redirect('student_form_view', form_id=form.id)

    # create response
    fr = FormResponse.objects.create(form=form, submitted_by=profile)

    # form structure expected as list of questions in form.structure.get('questions')
    questions = form.structure.get('questions', []) if isinstance(form.structure, dict) else []
    for q in questions:
        qid = str(q.get('id') or q.get('label'))
        answer = request.POST.get(qid, '')
        ResponseAnswer.objects.create(response=fr, question=q.get('label', ''), answer=answer)

    # Redirect to a success page instead of using messages
    return render(request, 'EvalMateApp/student_form_success.html', {'form': form})


@csrf_exempt
@login_required
def api_publish_form(request):
    # Accept JSON payload from form-builder and save as FormTemplate
    profile = request.user.profile
    if profile.account_type != 'faculty':
        return JsonResponse({'error': 'Access denied'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    title = payload.get('title') or 'Untitled Form'
    description = payload.get('description', '')
    settings = payload.get('settings', {})
    course_id = settings.get('courseId', '')
    institution = profile.institution
    accessibility = settings.get('accessibility', 'public')
    passcode = settings.get('passcode') if settings.get('requirePasscode') else ''

    # Map form builder values to model values
    privacy_mapping = {
        'public': 'institution',
        'department': 'institution_course',
        'institution': 'institution',
        'institution_course': 'institution_course'
    }
    privacy = privacy_mapping.get(accessibility, 'institution')

    form = FormTemplate.objects.create(
        title=title,
        description=description,
        course_id=course_id,
        institution=institution,
        structure=payload,
        created_by=profile,
        privacy=privacy,
        passcode=passcode or None,
    )

    return JsonResponse({'success': True, 'form_id': form.id})
