from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import UserRegisterForm, ProfileForm
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

from .models import FormTemplate, FormResponse, ResponseAnswer, Profile

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
                
                # Check if email is verified
                if not profile.email_verified:
                    messages.warning(request, 'Please verify your email address before logging in. Check your inbox for the verification link.')
                    return render(request, 'EvalMateApp/login.html', {'form': form, 'email': profile.email})
                
                # Log the user in
                login(request, user)
                messages.success(request, f'Welcome back, {user.username}!')
                
                # Redirect based on account type
                if profile.account_type == 'student':
                    return redirect('student_dashboard')
                elif profile.account_type == 'faculty':
                    return redirect('faculty_dashboard')
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
        
        # Check if request is AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        if user_form.is_valid() and profile_form.is_valid():
            try:
                # Create user
                user = user_form.save(commit=False)
                user.email = profile_form.cleaned_data['email']
                user.is_active = True
                user.save()
                
                # Create profile
                profile = profile_form.save(commit=False)
                profile.user = user
                profile.email_verified = False
                
                # Generate 6-digit verification code
                verification_code = profile.generate_verification_code()
                profile.save()
                
                # Send verification email with code
                send_verification_code_email(request, user, profile, verification_code)
                
                # Store user ID in session for verification
                request.session['pending_verification_user_id'] = user.id
                
                if is_ajax:
                    return JsonResponse({
                        'success': True,
                        'message': f'Account created! Verification code sent to {profile.email}',
                        'email': profile.email,
                        'user_id': user.id
                    })
                else:
                    messages.success(request, f'Account created! Verification code sent to {profile.email}')
                    return redirect('email_verification_sent')
                    
            except Exception as e:
                if user.id:
                    user.delete()  # Rollback if something fails
                if is_ajax:
                    return JsonResponse({
                        'success': False,
                        'message': f'Failed to create account: {str(e)}'
                    }, status=400)
                else:
                    messages.error(request, f'Failed to create account: {str(e)}')
                    return render(request, 'EvalMateApp/register.html', {'user_form': user_form, 'profile_form': profile_form})
        else:
            # Show specific form errors
            errors = {}
            error_messages = []
            
            if user_form.errors:
                for field, error_list in user_form.errors.items():
                    errors[field] = [str(e) for e in error_list]
                    error_messages.extend([str(e) for e in error_list])
                    
            if profile_form.errors:
                for field, error_list in profile_form.errors.items():
                    errors[field] = [str(e) for e in error_list]
                    error_messages.extend([str(e) for e in error_list])
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': '; '.join(error_messages) if error_messages else 'Please fix the errors in the form.',
                    'errors': errors
                }, status=400)
            else:
                for msg in error_messages:
                    messages.error(request, msg)
                return render(request, 'EvalMateApp/register.html', {'user_form': user_form, 'profile_form': profile_form})
    else:
        user_form = UserRegisterForm()
        profile_form = ProfileForm()
    return render(request, 'EvalMateApp/register.html', {'user_form': user_form, 'profile_form': profile_form})


def send_verification_code_email(request, user, profile, code):
    """Send 6-digit verification code to user's email"""
    subject = 'Verify Your EvalMate Account - Verification Code'
    html_message = render_to_string('EvalMateApp/emails/verification_code_email.html', {
        'user': user,
        'profile': profile,
        'verification_code': code,
    })
    plain_message = f"""
Hello {profile.first_name} {profile.last_name},

Welcome to EvalMate! Your verification code is:

{code}

This code will expire in 15 minutes.

If you didn't create this account, please ignore this email.

Thank you,
EvalMate Team
"""
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[profile.email],
        html_message=html_message,
        fail_silently=False,
    )


def verify_code_view(request):
    """AJAX endpoint to verify the 6-digit code"""
    if request.method == 'POST':
        try:
            # Get code from POST data
            code = request.POST.get('code', '').strip()
            
            # Get user_id from session
            user_id = request.session.get('pending_verification_user_id')
            
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'message': 'Session expired. Please register again.'
                }, status=400)
            
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            # Check if code matches and is still valid
            if profile.verification_code == code:
                if profile.is_verification_code_valid():
                    # Mark as verified and log user in
                    profile.email_verified = True
                    profile.verification_code = None  # Clear the code
                    profile.save()
                    
                    # Log the user in automatically
                    login(request, user)
                    
                    # Clear session
                    if 'pending_verification_user_id' in request.session:
                        del request.session['pending_verification_user_id']
                    
                    # Determine redirect URL based on account type
                    if profile.account_type == 'student':
                        redirect_url = '/dashboard/student/'
                    else:  # faculty
                        redirect_url = '/dashboard/faculty/'
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'Email verified successfully!',
                        'redirect': redirect_url
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Verification code has expired. Please request a new one.'
                    }, status=400)
            else:
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid or expired code. Please try again.'
                }, status=400)
                
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'User not found. Please register again.'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)


def resend_code_view(request):
    """AJAX endpoint to resend verification code"""
    if request.method == 'POST':
        try:
            # Get user_id from session
            user_id = request.session.get('pending_verification_user_id')
            
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'message': 'Session expired. Please register again.'
                }, status=400)
            
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            # Generate new code
            new_code = profile.generate_verification_code()
            profile.save()
            
            # Send new email
            send_verification_code_email(request, user, profile, new_code)
            
            return JsonResponse({
                'success': True,
                'message': f'New verification code sent to {profile.email}'
            })
            
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'User not found. Please register again.'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


def email_verification_sent_view(request):
    """Page shown after registration to inform user to check email"""
    return render(request, 'EvalMateApp/email_verification_sent.html')


def resend_verification_view(request):
    """Allow users to resend verification code via web form"""
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        try:
            profile = Profile.objects.get(email=email, email_verified=False)
            
            # Generate new code
            new_code = profile.generate_verification_code()
            profile.save()
            
            # Send new email
            send_verification_code_email(request, profile.user, profile, new_code)
            
            messages.success(request, 'Verification code sent! Please check your inbox.')
            return redirect('email_verification_sent')
            
        except Profile.DoesNotExist:
            messages.error(request, 'Email not found or already verified.')
        except Exception as e:
            messages.error(request, f'Error sending email: {str(e)}')
    
    return render(request, 'EvalMateApp/resend_verification.html')

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
    try:
        profile = request.user.profile
    except Exception as e:
        return JsonResponse({'error': f'Profile not found: {str(e)}'}, status=403)
    
    if profile.account_type != 'faculty':
        return JsonResponse({'error': 'Access denied - Faculty only'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception as e:
        return JsonResponse({'error': f'Invalid JSON: {str(e)}'}, status=400)

    # Validate required fields
    title = payload.get('title', '').strip()
    if not title:
        return JsonResponse({'error': 'Form title is required'}, status=400)
    
    sections = payload.get('sections', [])
    if not sections or len(sections) == 0:
        return JsonResponse({'error': 'At least one section is required'}, status=400)
    
    # Check if there are any questions
    has_questions = any(section.get('questions') and len(section.get('questions', [])) > 0 for section in sections)
    if not has_questions:
        return JsonResponse({'error': 'At least one question is required'}, status=400)

    try:
        description = payload.get('description', '')
        settings = payload.get('settings', {})
        course_id = settings.get('courseId', '')
        institution = getattr(profile, 'institution', '') or ''
        accessibility = settings.get('accessibility', 'public')
        passcode = settings.get('passcode', '').strip() if settings.get('requirePasscode') else ''

        # Validate passcode if required
        if settings.get('requirePasscode'):
            if not passcode:
                return JsonResponse({'error': 'Passcode is required when "Require Passcode" is enabled'}, status=400)
            if len(passcode) != 6 or not passcode.isdigit():
                return JsonResponse({'error': 'Passcode must be exactly 6 digits'}, status=400)

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
    
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Error creating form: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': f'Failed to create form: {str(e)}'}, status=500)
