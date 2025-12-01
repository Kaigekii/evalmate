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
from django.views.decorators.cache import never_cache, cache_control
from django.views.decorators.csrf import csrf_exempt

from .models import FormTemplate, FormResponse, ResponseAnswer, Profile, PendingEvaluation, DraftResponse

import json
import time


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
                
                # Redirect based on account type
                if profile.account_type == 'student':
                    return redirect('student_dashboard')
                elif profile.account_type == 'faculty':
                    return redirect('faculty_dashboard')
                else:
                    return redirect('home')
                    
            except Exception as e:
                messages.error(request, 'Unable to access your profile. Please contact support.')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        # Clear any old messages when showing fresh login page
        storage = messages.get_messages(request)
        for _ in storage:
            pass
        storage.used = True
        form = AuthenticationForm()
    return render(request, 'EvalMateApp/login.html', {'form': form})

def register_view(request):
    if request.method == 'POST':
        print("========== REGISTRATION REQUEST RECEIVED ==========")
        print(f"Request method: {request.method}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"POST data: {request.POST}")
        
        # Check if this is an AJAX request
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        print(f"Is AJAX: {is_ajax}")
        
        user_form = UserRegisterForm(request.POST)
        profile_form = ProfileForm(request.POST)
        
        if user_form.is_valid() and profile_form.is_valid():
            try:
                user = user_form.save()
                profile = profile_form.save(commit=False)
                profile.user = user
                # No email verification required anymore — just save the profile
                profile.save()
                
                # Log the user in
                login(request, user)
                
                # Determine redirect URL based on account type
                if profile.account_type == 'student':
                    redirect_url = '/dashboard/student/'
                elif profile.account_type == 'faculty':
                    redirect_url = '/dashboard/faculty/'
                else:
                    redirect_url = '/'
                
                if is_ajax:
                    from django.http import JsonResponse
                    return JsonResponse({
                        'success': True,
                        'user_id': user.id,
                        'redirect': redirect_url
                    })
                else:
                    return redirect(redirect_url)
                    
            except Exception as e:
                print(f"Registration error: {str(e)}")  # Log the actual error
                error_msg = f'Unable to create account: {str(e)}'
                if is_ajax:
                    from django.http import JsonResponse
                    return JsonResponse({
                        'success': False,
                        'message': error_msg
                    })
                else:
                    messages.error(request, error_msg)
        else:
            # Collect form errors
            errors = []
            if user_form.errors:
                for field, error_list in user_form.errors.items():
                    for error in error_list:
                        errors.append(f"{field}: {error}")
            if profile_form.errors:
                for field, error_list in profile_form.errors.items():
                    for error in error_list:
                        errors.append(f"{field}: {error}")
            
            error_msg = ' '.join(errors) if errors else 'Please correct the errors in the form.'
            
            if is_ajax:
                from django.http import JsonResponse
                return JsonResponse({
                    'success': False,
                    'message': error_msg,
                    'errors': {
                        'user_form': dict(user_form.errors),
                        'profile_form': dict(profile_form.errors)
                    }
                })
            else:
                messages.error(request, error_msg)
    else:
        user_form = UserRegisterForm()
        profile_form = ProfileForm()
    
    import time
    context = {
        'user_form': user_form,
        'profile_form': profile_form,
        'timestamp': int(time.time())
    }
    return render(request, 'EvalMateApp/register.html', context)

def verify_code_view(request):
    """Deprecated - email verification removed"""
    return redirect('home')

def resend_code_view(request):
    """Deprecated - email verification removed"""
    return redirect('home')

def logout_view(request):
    # Clear all messages before logout
    storage = messages.get_messages(request)
    for _ in storage:
        pass  # Iterate through to clear
    storage.used = True
    
    logout(request)
    # Clear session data
    request.session.flush()
    response = redirect('login')
    # Prevent caching
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

@never_cache
@login_required
def student_dashboard_view(request):
    """Student Dashboard - Single Page Application (SPA)"""
    if not request.user.is_authenticated:
        return redirect('login')
    
    try:
        profile = request.user.profile
        # Check if this is actually a faculty account
        if profile.account_type == 'faculty':
            # Only redirect if explicitly faculty
            return redirect('faculty_dashboard')
        # Allow students and any other account type to see student dashboard
    except Profile.DoesNotExist:
        # No profile exists - redirect to login
        return redirect('login')
    except Exception as e:
        # Log the error for debugging
        print(f"Error in student_dashboard_view: {str(e)}")
        return redirect('login')
    
    import time
    context = {
        'user': request.user,
        'profile': profile,
        'timestamp': int(time.time())  # Cache busting
    }
    return render(request, 'EvalMateApp/student-overview.html', context)

@never_cache
@login_required
def faculty_dashboard_view(request):
    """Faculty dashboard view with recent activities and forms management"""
    try:
        profile = request.user.profile
        # Check if this is actually a student account
        if profile.account_type == 'student':
            # Only redirect if explicitly student
            return redirect('student_dashboard')
        # Allow faculty and any other account type to see faculty dashboard
    except Profile.DoesNotExist:
        # No profile exists - redirect to login
        return redirect('login')
    except Exception as e:
        # Log the error for debugging
        print(f"Error in faculty_dashboard_view: {str(e)}")
        return redirect('login')
    
    from django.db.models import Count, Prefetch
    
    # Get recent activities (last 3 submissions)
    recent_submissions = FormResponse.objects.filter(
        form__created_by=profile
    ).select_related(
        'form', 'submitted_by__user'
    ).order_by('-submitted_at')[:3]
    
    # Get all forms created by this faculty
    forms = FormTemplate.objects.filter(
        created_by=profile
    ).annotate(
        response_count=Count('responses')
    ).order_by('-created_at')
    
    # Count statistics
    total_forms = forms.count()
    published_forms = forms.exclude(privacy='private').count()  # All non-private are published
    draft_forms = forms.filter(privacy='private').count()
    
    import time
    
    context = {
        'user': request.user,
        'profile': profile,
        'recent_submissions': recent_submissions,
        'forms': forms,
        'total_forms': total_forms,
        'published_forms': published_forms,
        'draft_forms': draft_forms,
        'timestamp': int(time.time()),  # Cache buster for JavaScript files
    }
    return render(request, 'EvalMateApp/faculty-dashboard.html', context)

@never_cache
@never_cache
@login_required
def form_builder_view(request):
    """Form builder view for faculty members"""
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            # Silently redirect without error message
            return redirect('student_dashboard')
    except Exception as e:
        # Silently redirect to login without error message
        return redirect('login')
    
    context = {
        'user': request.user,
        'profile': profile,
        'timestamp': int(time.time())
    }
    return render(request, 'EvalMateApp/form-builder.html', context)


@never_cache
@login_required
def faculty_reports_view(request):
    # Only faculty
    profile = request.user.profile
    if profile.account_type != 'faculty':
        return HttpResponseForbidden('Access denied')

    from django.db.models import Count, Q
    from django.db.models.functions import Concat
    from django.db.models import CharField, Value
    
    today = timezone.localdate()
    
    # Count unique students (submitted_by + team_identifier combinations) instead of all responses
    forms = FormTemplate.objects.filter(created_by=profile).select_related('created_by').order_by('-created_at')
    
    forms_data = []
    for f in forms:
        # Get unique student submissions by grouping (submitted_by, team_identifier)
        responses = f.responses.select_related('submitted_by').all()
        unique_students = set()
        unique_today = set()
        has_unread = False
        
        for r in responses:
            student_key = (r.submitted_by.id, r.team_identifier)
            unique_students.add(student_key)
            
            if r.submitted_at.date() == today:
                unique_today.add(student_key)
            
            if not r.is_read:
                has_unread = True
        
        forms_data.append({
            'form': f,
            'total_submissions': len(unique_students),
            'todays_submissions': len(unique_today),
            'unread_submissions': 1 if has_unread else 0,
        })

    return render(request, 'EvalMateApp/reports_list.html', {
        'forms_data': forms_data, 
        'profile': profile,
        'timestamp': int(time.time())
    })


@never_cache
@login_required
def faculty_form_responses_view(request, form_id):
    profile = request.user.profile
    if profile.account_type != 'faculty':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate.objects.select_related('created_by'), id=form_id, created_by=profile)
    
    # Group responses by student and team, keeping individual teammates
    from collections import defaultdict
    grouped_responses = defaultdict(lambda: {
        'student': None,
        'team': None,
        'teammates': [],
        'submitted_at': None,
        'has_unread': False
    })
    
    all_responses = form.responses.select_related('submitted_by', 'submitted_by__user').order_by('-submitted_at')
    
    for response in all_responses:
        key = (response.submitted_by.id, response.team_identifier)
        group = grouped_responses[key]
        
        if group['student'] is None:
            group['student'] = response.submitted_by
            group['team'] = response.team_identifier
            group['submitted_at'] = response.submitted_at
        
        # Add each teammate as a separate item
        group['teammates'].append({
            'name': response.teammate_name,
            'response_id': response.id,
            'is_read': response.is_read,
            'submitted_at': response.submitted_at
        })
        
        if not response.is_read:
            group['has_unread'] = True
    
    # Convert to list and sort by submission time
    responses_list = sorted(grouped_responses.values(), key=lambda x: x['submitted_at'], reverse=True)
    
    # Count unique students who submitted (not total teammate evaluations)
    total_responses = len(responses_list)
    
    return render(request, 'EvalMateApp/reports_form_responses.html', {
        'form': form, 
        'grouped_responses': responses_list,
        'total_responses': total_responses
    })


@never_cache
@login_required
def faculty_response_detail_view(request, form_id, response_id):
    profile = request.user.profile
    if profile.account_type != 'faculty':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate.objects.select_related('created_by'), id=form_id, created_by=profile)
    response = get_object_or_404(
        FormResponse.objects.select_related('submitted_by', 'submitted_by__user', 'form').prefetch_related('answers'),
        id=response_id, 
        form=form
    )
    
    # Mark as read
    if not response.is_read:
        response.is_read = True
        response.save(update_fields=['is_read'])
    
    # Parse form structure to get actual questions
    sections = form.structure.get('sections', []) if form.structure else []
    
    # Create a mapping of question_id -> question data
    question_map = {}
    for section in sections:
        for question in section.get('questions', []):
            question_id = question.get('id')
            if question_id:
                # Store both with and without 'question_' prefix
                question_map[str(question_id)] = question
                question_map[f"question_{question_id}"] = question
    
    # Build enriched answers list with full question data
    answers = response.answers.all()
    enriched_answers = []
    for answer in answers:
        question_id = answer.question
        question_data = question_map.get(question_id, {})
        enriched_answers.append({
            'question_id': question_id,
            'question_data': question_data,
            'answer': answer.answer,
            'answer_obj': answer
        })
    
    context = {
        'form': form,
        'response': response,
        'answers': enriched_answers,
        'sections': sections,
    }
    
    return render(request, 'EvalMateApp/reports_response_detail.html', context)


@never_cache
@login_required
def student_search_forms(request):
    # AJAX endpoint returning JSON list of forms the student can see
    profile = request.user.profile
    if profile.account_type != 'student':
        return JsonResponse({'error': 'Access denied'}, status=403)

    q = request.GET.get('q', '').strip()
    # EXCLUDE DRAFTS - only show published forms
    qs = FormTemplate.objects.exclude(privacy='private')
    results = []

    if q:
        # search by course_id or title
        qs = qs.filter(Q(course_id__icontains=q) | Q(title__icontains=q))
    else:
        qs = qs.none()

    # Get forms already in student's pending evaluations
    pending_form_ids = set(PendingEvaluation.objects.filter(
        student=profile
    ).values_list('form_id', flat=True))

    # Filter by privacy rules (exclude drafts already done above)
    visible = []
    for f in qs:
        # Check if student's institution matches form's institution
        if not f.institution or f.institution != profile.institution:
            continue
            
        # Institution privacy - show to all students in same institution
        if f.privacy == 'institution':
            visible.append(f)
        # Institution+Course privacy - show to students in same institution (already filtered by search query above)
        elif f.privacy == 'institution_course':
            visible.append(f)

    for f in visible:
        results.append({
            'id': f.id,
            'title': f.title,
            'course_id': f.course_id,
            'created_at': f.created_at.isoformat(),
            'requires_passcode': bool(f.passcode),
            'is_pending': f.id in pending_form_ids,  # Flag if already in pending
        })

    return JsonResponse({'results': results})


@never_cache
@login_required
def student_form_view(request, form_id):
    """Entry point when student clicks on a form - shows passcode page if required"""
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)

    # BLOCK DRAFTS - students cannot access unpublished forms
    if form.privacy == 'private':
        messages.error(request, 'This form is not published yet.')
        return redirect('student_dashboard')

    # Check privacy
    allowed = False
    if form.privacy == 'institution' and form.institution == profile.institution:
        allowed = True
    elif form.privacy == 'institution_course' and form.institution == profile.institution and form.course_id:
        allowed = True

    if not allowed:
        messages.error(request, 'This form is not available for your institution or course.')
        return redirect('student_dashboard')

    # Clear any old messages before showing passcode page
    storage = messages.get_messages(request)
    storage.used = True
    
    # If form has passcode, check if already verified in this session
    if form.passcode:
        verified_forms = request.session.get('verified_forms', [])
        if form.id not in verified_forms:
            # Passcode not yet verified - show passcode page
            return render(request, 'EvalMateApp/student_form_passcode.html', {'form': form})
    
    # No passcode required OR already verified - add directly to pending evaluations
    pending, created = PendingEvaluation.objects.get_or_create(
        student=profile,
        form=form
    )
    
    if created:
        messages.success(request, f'"{form.title}" has been added to your pending evaluations!')
    else:
        messages.info(request, f'"{form.title}" is already in your pending evaluations.')
    
    return redirect('student_dashboard')


@never_cache
@login_required
def student_form_access(request, form_id):
    """Handle passcode verification and add form to pending evaluations"""
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)
    if request.method != 'POST':
        return redirect('student_form_view', form_id=form.id)

    entered = request.POST.get('passcode', '').strip()
    
    # Clear all old messages first
    storage = messages.get_messages(request)
    storage.used = True
    
    # Check passcode if required
    if form.passcode and entered != form.passcode:
        messages.error(request, 'Incorrect passcode.')
        return render(request, 'EvalMateApp/student_form_passcode.html', {'form': form})
    
    # Passcode correct - store in session to avoid re-asking
    if form.passcode:
        verified_forms = request.session.get('verified_forms', [])
        if form.id not in verified_forms:
            verified_forms.append(form.id)
            request.session['verified_forms'] = verified_forms
            request.session.modified = True
    
    # Add to pending evaluations
    pending, created = PendingEvaluation.objects.get_or_create(
        student=profile,
        form=form
    )
    
    if created:
        messages.success(request, f'"{form.title}" has been added to your pending evaluations!')
    else:
        messages.info(request, f'"{form.title}" is already in your pending evaluations.')
    
    # Redirect to student dashboard (pending evaluations tab)
    return redirect('student_dashboard')


@never_cache
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


@never_cache
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
        accessibility = settings.get('accessibility', 'draft')  # default to draft
        is_published = settings.get('publish', False)  # check if publishing
        passcode = settings.get('passcode', '').strip() if settings.get('requirePasscode') else ''

        # Validate passcode if required
        if settings.get('requirePasscode'):
            if not passcode:
                return JsonResponse({'error': 'Passcode is required when "Require Passcode" is enabled'}, status=400)
            if len(passcode) != 6 or not passcode.isdigit():
                return JsonResponse({'error': 'Passcode must be exactly 6 digits'}, status=400)

        # Determine privacy based on publish status
        if not is_published:
            # If not publishing, save as draft
            privacy = 'private'
        else:
            # Map form builder values to model values for published forms
            privacy_mapping = {
                'public': 'institution',
                'institution': 'institution',
                'department': 'institution_course',
                'institution_course': 'institution_course',
                'draft': 'private'
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


@never_cache
@login_required
def duplicate_form_api(request, form_id):
    """API endpoint to duplicate a form"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Get the original form
        original_form = get_object_or_404(FormTemplate, id=form_id, created_by=profile)
        
        # Create a duplicate
        duplicate = FormTemplate.objects.create(
            title=f"{original_form.title} (Copy)",
            description=original_form.description,
            course_id=original_form.course_id,
            institution=original_form.institution,
            structure=original_form.structure,
            created_by=profile,
            privacy='private',  # Always save as draft
            passcode=None,  # Clear passcode for duplicate
        )
        
        return JsonResponse({'success': True, 'form_id': duplicate.id})
    
    except Exception as e:
        import traceback
        print(f"Error duplicating form: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def delete_form_api(request, form_id):
    """API endpoint to delete a form"""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Get the form
        form = get_object_or_404(FormTemplate, id=form_id, created_by=profile)
        
        # Delete the form (this will cascade delete responses and answers)
        form.delete()
        
        return JsonResponse({'success': True})
    
    except Exception as e:
        import traceback
        print(f"Error deleting form: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def publish_form_api(request, form_id):
    """API endpoint to publish a draft form"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Get the form
        form = get_object_or_404(FormTemplate, id=form_id, created_by=profile)
        
        # Publish the form (change from private to institution)
        if form.privacy == 'private':
            form.privacy = 'institution'
            form.save(update_fields=['privacy'])
            return JsonResponse({'success': True, 'message': 'Form published successfully!'})
        else:
            return JsonResponse({'success': False, 'message': 'Form is already published'})
    
    except Exception as e:
        import traceback
        print(f"Error publishing form: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def unpublish_form_api(request, form_id):
    """API endpoint to unpublish a form (make it draft)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Get the form
        form = get_object_or_404(FormTemplate, id=form_id, created_by=profile)
        
        # Unpublish the form (change to private/draft)
        if form.privacy != 'private':
            form.privacy = 'private'
            form.save(update_fields=['privacy'])
            return JsonResponse({'success': True, 'message': 'Form moved to drafts'})
        else:
            return JsonResponse({'success': False, 'message': 'Form is already a draft'})
    
    except Exception as e:
        import traceback
        print(f"Error unpublishing form: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def get_form_details_api(request, form_id):
    """API endpoint to get form details"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'faculty':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Get the form with response count
        from django.db.models import Count
        form = get_object_or_404(
            FormTemplate.objects.annotate(response_count=Count('responses')),
            id=form_id,
            created_by=profile
        )
        
        # Return form details
        return JsonResponse({
            'id': form.id,
            'title': form.title,
            'description': form.description,
            'course_id': form.course_id,
            'institution': form.institution,
            'privacy': form.privacy,
            'structure': form.structure,
            'created_at': form.created_at.isoformat(),
            'due_date': form.due_date.isoformat() if form.due_date else None,
            'response_count': form.response_count,
        })
    
    except Exception as e:
        import traceback
        print(f"Error getting form details: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


# ========================
# NEW STUDENT EVALUATION VIEWS
# ========================

def _save_evaluation_draft(student, form, eval_data):
    """Helper function to save evaluation progress as draft - OVERWRITES existing draft"""
    try:
        team_identifier = eval_data.get('team_identifier', '')
        
        # Delete ALL existing drafts for this student and form (not just same team)
        deleted_count = DraftResponse.objects.filter(
            student=student,
            form=form
        ).delete()
        print(f"Deleted {deleted_count[0]} existing drafts for this form")
        
        # Create single new draft with current progress
        DraftResponse.objects.create(
            student=student,
            form=form,
            team_identifier=team_identifier,
            teammate_name='',  # Not specific to one teammate
            draft_data=eval_data
        )
        print(f"Draft saved: {len(eval_data.get('evaluations', []))} evaluations completed")
    except Exception as e:
        print(f"Error saving draft: {str(e)}")


@never_cache
@login_required
def student_eval_team_setup(request, form_id):
    """Step 1: Team Setup - Student enters team identifier and teammate names"""
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)

    # Check if form is published
    if form.privacy == 'private':
        messages.error(request, 'This form is not published yet.')
        return redirect('student_dashboard')

    # Check privacy/accessibility
    allowed = False
    if form.privacy == 'institution' and form.institution == profile.institution:
        allowed = True
    elif form.privacy == 'institution_course' and form.institution == profile.institution and form.course_id:
        allowed = True

    if not allowed:
        messages.error(request, 'This form is not available for your institution or course.')
        return redirect('student_dashboard')

    # CRITICAL: Check passcode protection - redirect to entry point if not verified
    if form.passcode:
        verified_forms = request.session.get('verified_forms', [])
        if form.id not in verified_forms:
            messages.warning(request, 'Please enter the form passcode first.')
            return redirect('student_form_view', form_id=form.id)

    # Extract settings from form structure (needed for both GET and POST)
    settings = form.structure.get('settings', {}) if isinstance(form.structure, dict) else {}
    min_team_size = settings.get('minTeamSize', 2)
    max_team_size = settings.get('maxTeamSize', 10)
    
    # Check if there's existing session data
    eval_session_key = f'eval_{form_id}'
    existing_session = request.session.get(eval_session_key, {})
    
    # Check if there's a draft - if so, load it and redirect to evaluations
    if request.method == 'GET' and not request.GET.get('force_edit'):
        drafts = DraftResponse.objects.filter(student=profile, form=form)
        if drafts.exists():
            # Load draft data into session
            draft = drafts.first()
            draft_data = draft.draft_data or {}
            
            # If draft has team setup data, restore it
            if 'team_identifier' in draft_data and 'teammate_names' in draft_data:
                request.session[eval_session_key] = {
                    'team_identifier': draft_data.get('team_identifier'),
                    'teammate_names': draft_data.get('teammate_names', []),
                    'current_index': draft_data.get('current_index', 0),
                    'evaluations': draft_data.get('evaluations', []),
                }
                request.session.modified = True
                
                print(f"=== DRAFT LOADED ===")
                print(f"Team: {draft_data.get('team_identifier')}")
                print(f"Teammates: {draft_data.get('teammate_names')}")
                print(f"Current index: {draft_data.get('current_index')}")
                print(f"Completed evaluations: {len(draft_data.get('evaluations', []))}")
                
                # Redirect to evaluations to continue where they left off
                messages.success(request, 'Resuming your saved progress...')
                return redirect('student_eval_evaluations', form_id=form.id)

    # Handle POST - save team setup to session
    if request.method == 'POST':
        print(f"\n{'='*50}")
        print(f"=== FORM SUBMIT TRIGGERED ===")
        print(f"{'='*50}")
        
        team_identifier = request.POST.get('team_identifier', '').strip()
        print(f"Team identifier: '{team_identifier}'")
        
        # Get all teammate names from form
        teammate_names = []
        for key, value in request.POST.items():
            if key.startswith('teammate_name_') and value.strip():
                teammate_names.append(value.strip())
        
        print(f"Teammate names found: {teammate_names}")
        print(f"Number of teammates: {len(teammate_names)}")
        print(f"Min required: {min_team_size}, Max allowed: {max_team_size}")
        
        if not team_identifier:
            print("ERROR: No team identifier provided!")
            messages.error(request, 'Team identifier is required.')
            context = {
                'form': form,
                'settings_json': json.dumps(settings)
            }
            return render(request, 'EvalMateApp/student_eval_team_setup.html', context)
        
        if len(teammate_names) < min_team_size:
            print(f"ERROR: Too few teammates ({len(teammate_names)} < {min_team_size})")
            messages.error(request, f'At least {min_team_size} teammates are required.')
            context = {
                'form': form,
                'settings_json': json.dumps(settings)
            }
            return render(request, 'EvalMateApp/student_eval_team_setup.html', context)
        
        if len(teammate_names) > max_team_size:
            print(f"ERROR: Too many teammates ({len(teammate_names)} > {max_team_size})")
            messages.error(request, f'Maximum {max_team_size} teammates allowed.')
            context = {
                'form': form,
                'settings_json': json.dumps(settings)
            }
            return render(request, 'EvalMateApp/student_eval_team_setup.html', context)
        
        # Store in session - preserve existing evaluations if any
        request.session[eval_session_key] = {
            'team_identifier': team_identifier,
            'teammate_names': teammate_names,
            'current_index': existing_session.get('current_index', 0),
            'evaluations': existing_session.get('evaluations', []),
        }
        request.session.modified = True
        
        print(f"\n=== TEAM SETUP SAVED ===")
        print(f"Session key: {eval_session_key}")
        print(f"Team: {team_identifier}")
        print(f"Teammates: {teammate_names}")
        print(f"Current index: {request.session[eval_session_key]['current_index']}")
        print(f"Existing evaluations: {len(request.session[eval_session_key]['evaluations'])}")
        print(f"Redirecting to: student_eval_evaluations with form_id={form.id}")
        print(f"{'='*50}\n")
        
        # Redirect to evaluations page
        return redirect('student_eval_evaluations', form_id=form.id)
    
    # GET - show team setup form with settings
    # Pre-fill with existing session data if available
    context = {
        'form': form,
        'settings_json': json.dumps(settings),
        'team_identifier': existing_session.get('team_identifier', ''),
        'teammate_names': existing_session.get('teammate_names', []),
    }
    return render(request, 'EvalMateApp/student_eval_team_setup.html', context)


@never_cache
@login_required
def student_eval_evaluations(request, form_id):
    """Step 2: Evaluations - Student rates each teammate one by one"""
    print(f"\n=== EVALUATIONS PAGE LOADED ===")
    print(f"Form ID: {form_id}")
    
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)

    # Check session data
    eval_session_key = f'eval_{form_id}'
    eval_data = request.session.get(eval_session_key)
    
    print(f"Session key: {eval_session_key}")
    print(f"Session data found: {eval_data is not None}")
    
    if not eval_data:
        print("ERROR: No session data, redirecting to team setup")
        messages.error(request, 'Please complete team setup first.')
        return redirect('student_eval_team_setup', form_id=form.id)
    
    print(f"Team: {eval_data.get('team_identifier')}")
    print(f"Teammates: {eval_data.get('teammate_names')}")
    print(f"Current index: {eval_data.get('current_index')}")
    print(f"Evaluations completed: {len(eval_data.get('evaluations', []))}")
    
    teammate_names = eval_data.get('teammate_names', [])
    current_index = eval_data.get('current_index', 0)
    evaluations = eval_data.get('evaluations', [])
    
    # Check if all teammates are completed
    completed_teammate_names = [e.get('teammate') for e in evaluations]
    all_completed = len(completed_teammate_names) >= len(teammate_names)
    
    # If index is out of range, find first unevaluated or show completion message
    if current_index >= len(teammate_names):
        if all_completed:
            messages.info(request, 'All teammates have been evaluated. You can edit any evaluation or submit.')
            # Set to first teammate for review
            current_index = 0
            eval_data['current_index'] = 0
            request.session[eval_session_key] = eval_data
            request.session.modified = True
        else:
            # Find first unevaluated teammate
            for i, name in enumerate(teammate_names):
                if name not in completed_teammate_names:
                    current_index = i
                    eval_data['current_index'] = i
                    request.session[eval_session_key] = eval_data
                    request.session.modified = True
                    break
    
    # Prepare context
    current_teammate = teammate_names[current_index]
    
    # Get completed teammate names
    completed_teammates = [e.get('teammate') for e in evaluations]
    
    # Extract form structure for template access
    form_structure = form.structure if isinstance(form.structure, dict) else {}
    sections = form_structure.get('sections', [])
    
    # Get current teammate's saved answers if they exist
    current_teammate_answers = {}
    is_editing_existing = False
    for eval_item in evaluations:
        if eval_item.get('teammate') == current_teammate:
            current_teammate_answers = eval_item.get('answers', {})
            is_editing_existing = True
            break
    
    # Calculate actual completion count
    completed_count = len(evaluations)
    
    print(f"Context prepared:")
    print(f"  Current teammate: {current_teammate}")
    print(f"  Completed teammates: {completed_teammates}")
    print(f"  Is editing existing: {is_editing_existing}")
    print(f"  Completed count: {completed_count}/{len(teammate_names)}")
    
    context = {
        'form': form,
        'form_structure': form_structure,
        'sections': sections,
        'sections_json': json.dumps(sections),  # For JavaScript debugging
        'teammates': teammate_names,
        'total_teammates': len(teammate_names),
        'current_index': current_index,
        'current_teammate': current_teammate,
        'completed_teammates': completed_teammates,
        'team_identifier': eval_data.get('team_identifier'),
        'evaluations': evaluations,  # Pass all evaluations for navigation
        'current_answers': current_teammate_answers,  # Pre-fill answers if editing
        'is_editing_existing': is_editing_existing,  # Flag to show if editing
        'completed_count': completed_count,  # Actual number of completed evaluations
    }
    
    return render(request, 'EvalMateApp/student_eval_evaluations.html', context)


@never_cache
@login_required
def student_eval_submit_evaluation(request, form_id):
    """Submit evaluation for current teammate and move to next or finish"""
    print("\n" + "="*80)
    print(f"!!! SUBMIT EVALUATION VIEW CALLED !!!")
    print(f"Method: {request.method}")
    print(f"Form ID: {form_id}")
    print(f"User: {request.user.username}")
    print("="*80)
    
    if request.method != 'POST':
        print("ERROR: Not a POST request, redirecting to evaluations")
        return redirect('student_eval_evaluations', form_id=form_id)
    
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)

    # Get session data
    eval_session_key = f'eval_{form_id}'
    eval_data = request.session.get(eval_session_key)
    
    print(f"Session key: {eval_session_key}")
    print(f"Session data exists: {eval_data is not None}")
    
    if not eval_data:
        print("ERROR: No session data found!")
        messages.error(request, 'Session expired. Please start over.')
        return redirect('student_eval_team_setup', form_id=form.id)
    
    teammate_names = eval_data.get('teammate_names', [])
    current_index = eval_data.get('current_index', 0)
    evaluations = eval_data.get('evaluations', [])
    team_identifier = eval_data.get('team_identifier', 'Unknown Team')
    
    if current_index >= len(teammate_names):
        messages.error(request, 'Invalid evaluation state.')
        return redirect('student_eval_team_setup', form_id=form.id)
    
    current_teammate = teammate_names[current_index]
    
    # Collect answers from POST data
    answers = {}
    for key, value in request.POST.items():
        if key.startswith('question_'):
            # Handle checkbox questions (multiple values)
            if key in answers:
                # Already exists, convert to list and append
                if not isinstance(answers[key], list):
                    answers[key] = [answers[key]]
                answers[key].append(value)
            else:
                answers[key] = value
    
    # Convert lists to comma-separated strings for storage
    for key, value in answers.items():
        if isinstance(value, list):
            answers[key] = ', '.join(value)
    
    # Check if this teammate was already evaluated (editing mode)
    was_already_evaluated = any(e.get('teammate') == current_teammate for e in evaluations)
    
    # Remove existing evaluation for this teammate if editing
    evaluations = [e for e in evaluations if e.get('teammate') != current_teammate]
    
    # Store evaluation in session
    evaluations.append({
        'teammate': current_teammate,
        'answers': answers,
    })
    
    eval_data['evaluations'] = evaluations
    
    # Check if all teammates evaluated NOW (before updating index)
    completed_teammate_names = [e.get('teammate') for e in evaluations]
    all_completed = len(completed_teammate_names) >= len(teammate_names)
    
    print(f"Completion check: {len(completed_teammate_names)}/{len(teammate_names)} teammates evaluated")
    print(f"All completed: {all_completed}")
    
    # Update session with new evaluations data
    request.session[eval_session_key] = eval_data
    request.session.modified = True
    
    # Only update index and save draft if NOT all completed yet
    if not all_completed:
        # Only increment index if this was a new evaluation (not editing)
        # If editing, find the next unevaluated teammate
        if was_already_evaluated:
            # Find the next teammate that hasn't been evaluated
            next_index = current_index
            for i, name in enumerate(teammate_names):
                if name not in completed_teammate_names:
                    next_index = i
                    break
            eval_data['current_index'] = next_index
            print(f"Editing mode: Moving to next unevaluated teammate at index {next_index}")
        else:
            # New evaluation: move to next teammate
            eval_data['current_index'] = current_index + 1
            print(f"New evaluation: Moving to index {current_index + 1}")
        
        # Update session again with new index
        request.session[eval_session_key] = eval_data
        request.session.modified = True
        
        # Save draft after each evaluation (only if not complete)
        _save_evaluation_draft(profile, form, eval_data)
        print(f"Draft saved after evaluating {current_teammate}")
    else:
        print(f"All teammates completed! Proceeding to final submission...")
    
    # Check if all teammates evaluated
    if all_completed:
        # All done - save to database
        print(f"!!! ENTERING DATABASE SAVE BLOCK - all_completed is True !!!")
        from django.db import transaction
        
        try:
            with transaction.atomic():
                # Create FormResponse for the team
                team_identifier = eval_data.get('team_identifier', 'Unknown Team')
                
                print(f"=== SAVING EVALUATIONS ===")
                print(f"Student: {profile.user.username}")
                print(f"Form: {form.title} (ID: {form.id})")
                print(f"Team: {team_identifier}")
                print(f"Number of evaluations: {len(evaluations)}")
                
                # Create a response for each teammate evaluation
                for idx, evaluation in enumerate(evaluations):
                    teammate_name = evaluation.get('teammate')
                    answers_dict = evaluation.get('answers', {})
                    
                    print(f"Creating response {idx + 1}/{len(evaluations)} for teammate: {teammate_name}")
                    
                    # Create FormResponse
                    form_response = FormResponse.objects.create(
                        form=form,
                        submitted_by=profile,
                        team_identifier=team_identifier,
                        teammate_name=teammate_name,
                        is_draft=False,  # This is a final submission, not a draft
                    )
                    
                    print(f"FormResponse created with ID: {form_response.id}")
                    
                    # Create ResponseAnswer for each question
                    answer_count = 0
                    for question_key, answer_value in answers_dict.items():
                        ResponseAnswer.objects.create(
                            response=form_response,
                            question=question_key,
                            answer=answer_value,
                        )
                        answer_count += 1
                    
                    print(f"Created {answer_count} answers for this response")
                
                # Clear session
                del request.session[eval_session_key]
                request.session.modified = True
                print("Session cleared")
                
                # Remove from pending evaluations
                deleted_count = PendingEvaluation.objects.filter(student=profile, form=form).delete()
                print(f"Removed from pending evaluations: {deleted_count[0]} records deleted")
                
                # Delete all drafts for this form/team
                draft_deleted = DraftResponse.objects.filter(
                    student=profile, 
                    form=form,
                    team_identifier=team_identifier
                ).delete()
                print(f"Deleted drafts: {draft_deleted[0]} records")
                
                print("=== SUBMISSION COMPLETE ===")
            
            messages.success(request, f'✅ All evaluations submitted successfully! You evaluated {len(evaluations)} teammates for "{form.title}".')
            return redirect('student_dashboard')
        
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"=== ERROR SAVING EVALUATIONS ===")
            print(f"Error: {str(e)}")
            print(error_details)
            messages.error(request, f'Failed to save evaluations: {str(e)}. Please try again.')
            return redirect('student_eval_evaluations', form_id=form.id)
    
    # More teammates to evaluate - redirect to evaluations page
    return redirect('student_eval_evaluations', form_id=form.id)


# ==================== PENDING EVALUATIONS API ====================

@never_cache
@login_required
def api_get_pending_evaluations(request):
    """Get list of pending evaluations for student"""
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        from datetime import datetime, timezone
        
        pending = PendingEvaluation.objects.filter(student=profile).select_related('form', 'form__created_by')
        
        evaluations_list = []
        for p in pending:
            # Calculate days left
            days_left = None
            due_date = p.form.due_date
            if due_date:
                now = datetime.now(timezone.utc)
                delta = due_date - now
                days_left = max(0, delta.days)
            
            # Get team settings from form structure
            settings = p.form.structure.get('settings', {}) if isinstance(p.form.structure, dict) else {}
            min_team_size = settings.get('minTeamSize', 'N/A')
            max_team_size = settings.get('maxTeamSize', 'N/A')
            allow_self_eval = settings.get('allowSelfEvaluation', False)
            
            # Check if draft exists
            has_draft = DraftResponse.objects.filter(student=profile, form=p.form).exists()
            
            # Determine status
            if has_draft:
                status = 'in_progress'
            elif days_left is not None and days_left <= 3:
                status = 'urgent'
            else:
                status = 'not_started'
            
            evaluations_list.append({
                'id': p.id,
                'form_id': p.form.id,
                'title': p.form.title,
                'description': p.form.description,
                'course': p.form.course_id,
                'created_by': p.form.created_by.user.username if p.form.created_by else 'Unknown',
                'added_at': p.added_at.isoformat(),
                'days_left': days_left,
                'due_date': due_date.isoformat() if due_date else None,
                'status': status,
                'has_draft': has_draft,
                'team_settings': {
                    'min_team_size': min_team_size,
                    'max_team_size': max_team_size,
                    'allow_self_evaluation': allow_self_eval
                }
            })
        
        return JsonResponse({'pending_evaluations': evaluations_list})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
@csrf_exempt
def api_remove_pending_evaluation(request, pending_id):
    """Remove a form from pending evaluations"""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'DELETE method required'}, status=400)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        pending = get_object_or_404(PendingEvaluation, id=pending_id, student=profile)
        pending.delete()
        
        return JsonResponse({'success': True, 'message': 'Removed from pending evaluations'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def api_get_evaluation_history(request):
    """Get list of completed evaluations for student"""
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Get all responses submitted by this student
        responses = FormResponse.objects.filter(submitted_by=profile).select_related('form').order_by('-submitted_at')
        
        # Group by form to show unique forms (not individual teammate responses)
        seen_forms = set()
        history_list = []
        
        for response in responses:
            if response.form.id not in seen_forms:
                seen_forms.add(response.form.id)
                
                # Count how many teammates evaluated for this form
                teammate_count = FormResponse.objects.filter(
                    form=response.form,
                    submitted_by=profile,
                    team_identifier=response.team_identifier
                ).count()
                
                history_list.append({
                    'response_id': response.id,
                    'form_id': response.form.id,
                    'title': response.form.title,
                    'course': response.form.course_id,
                    'description': response.form.description,
                    'submitted_at': response.submitted_at.isoformat(),
                    'team_identifier': response.team_identifier or 'N/A',
                    'teammates_evaluated': teammate_count,
                })
        
        return JsonResponse({'history': history_list})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def api_get_evaluation_detail(request, response_id):
    """Get detailed evaluation data for a specific response"""
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Get all responses for this form and team
        first_response = FormResponse.objects.filter(
            id=response_id,
            submitted_by=profile
        ).select_related('form').first()
        
        if not first_response:
            return JsonResponse({'error': 'Evaluation not found'}, status=404)
        
        # Get all responses for this form and team identifier
        all_responses = FormResponse.objects.filter(
            form=first_response.form,
            submitted_by=profile,
            team_identifier=first_response.team_identifier
        ).prefetch_related('answers').order_by('teammate_name')
        
        # Build response data
        teammates_data = []
        for resp in all_responses:
            answers_data = []
            for answer in resp.answers.all():
                answers_data.append({
                    'question': answer.question,
                    'answer': answer.answer
                })
            
            teammates_data.append({
                'teammate_name': resp.teammate_name or 'Unknown',
                'submitted_at': resp.submitted_at.isoformat(),
                'answers': answers_data
            })
        
        return JsonResponse({
            'form_title': first_response.form.title,
            'course': first_response.form.course_id,
            'description': first_response.form.description,
            'team_identifier': first_response.team_identifier or 'N/A',
            'teammates': teammates_data,
            'total_teammates': len(teammates_data)
        })
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
@csrf_exempt
def api_save_draft(request):
    """Save draft response for evaluation in progress"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=400)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        data = json.loads(request.body)
        form_id = data.get('form_id')
        draft_data = data.get('draft_data', {})
        team_identifier = data.get('team_identifier', '')
        teammate_name = data.get('teammate_name', '')
        
        if not form_id:
            return JsonResponse({'error': 'form_id required'}, status=400)
        
        form = get_object_or_404(FormTemplate, id=form_id)
        
        # Create or update draft
        draft, created = DraftResponse.objects.update_or_create(
            student=profile,
            form=form,
            team_identifier=team_identifier,
            teammate_name=teammate_name,
            defaults={'draft_data': draft_data}
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Draft saved successfully',
            'draft_id': draft.id,
            'last_saved': draft.last_saved.isoformat()
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def api_get_draft(request, form_id):
    """Get saved draft for a specific form"""
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        team_identifier = request.GET.get('team_identifier', '')
        teammate_name = request.GET.get('teammate_name', '')
        
        # Get draft
        draft = DraftResponse.objects.filter(
            student=profile,
            form_id=form_id,
            team_identifier=team_identifier,
            teammate_name=teammate_name
        ).first()
        
        if draft:
            return JsonResponse({
                'has_draft': True,
                'draft_data': draft.draft_data,
                'last_saved': draft.last_saved.isoformat()
            })
        else:
            return JsonResponse({'has_draft': False})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
@csrf_exempt
def api_delete_draft(request, form_id):
    """Delete saved draft"""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'DELETE method required'}, status=400)
    
    try:
        profile = request.user.profile
        if profile.account_type != 'student':
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        data = json.loads(request.body) if request.body else {}
        team_identifier = data.get('team_identifier', '')
        teammate_name = data.get('teammate_name', '')
        
        # Delete draft
        DraftResponse.objects.filter(
            student=profile,
            form_id=form_id,
            team_identifier=team_identifier,
            teammate_name=teammate_name
        ).delete()
        
        return JsonResponse({'success': True, 'message': 'Draft deleted successfully'})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def student_eval_navigate_teammate(request, form_id, teammate_index):
    """Navigate to a specific teammate's evaluation (for editing)"""
    profile = request.user.profile
    if profile.account_type != 'student':
        return HttpResponseForbidden('Access denied')

    form = get_object_or_404(FormTemplate, id=form_id)

    # Get session data
    eval_session_key = f'eval_{form_id}'
    eval_data = request.session.get(eval_session_key)
    
    if not eval_data:
        messages.error(request, 'Session expired. Please start over.')
        return redirect('student_eval_team_setup', form_id=form.id)
    
    teammate_names = eval_data.get('teammate_names', [])
    
    # Validate index
    if teammate_index < 0 or teammate_index >= len(teammate_names):
        messages.error(request, 'Invalid teammate index.')
        return redirect('student_eval_evaluations', form_id=form.id)
    
    # Update current index
    eval_data['current_index'] = teammate_index
    request.session[eval_session_key] = eval_data
    request.session.modified = True
    
    # Save draft with new position
    _save_evaluation_draft(profile, form, eval_data)
    
    return redirect('student_eval_evaluations', form_id=form.id)


@never_cache
@login_required
def api_upload_profile_picture(request):
    """Upload profile picture"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=400)
    
    try:
        profile = request.user.profile
        print(f"[DEBUG] User: {request.user.username}, Profile ID: {profile.id}")
        
        # Check if file was uploaded
        if 'profile_picture' not in request.FILES:
            print("[DEBUG] No file in request.FILES")
            print(f"[DEBUG] request.FILES keys: {list(request.FILES.keys())}")
            return JsonResponse({'error': 'No file uploaded'}, status=400)
        
        uploaded_file = request.FILES['profile_picture']
        print(f"[DEBUG] File received: {uploaded_file.name}, Size: {uploaded_file.size}, Type: {uploaded_file.content_type}")
        
        # Validate file size (5MB limit)
        if uploaded_file.size > 5 * 1024 * 1024:
            return JsonResponse({'error': 'File size exceeds 5MB limit'}, status=400)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if uploaded_file.content_type not in allowed_types:
            return JsonResponse({'error': 'Only JPG and PNG files are allowed'}, status=400)
        
        # Save locally first (for backward compatibility)
        profile.profile_picture = uploaded_file
        profile.save()
        local_url = profile.profile_picture.url if profile.profile_picture else ''
        print(f"[DEBUG] Local profile picture saved: {local_url}")

        # Try Supabase Storage upload if configured
        import os
        SUPABASE_URL = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
        SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        bucket = os.environ.get('SUPABASE_PROFILE_BUCKET', 'profile-pictures')
        public_url = None

        try:
            if SUPABASE_URL and SUPABASE_KEY:
                from supabase import create_client
                supa = create_client(SUPABASE_URL, SUPABASE_KEY)

                # Path: user_id/timestamp_filename
                import time
                safe_name = uploaded_file.name.replace(' ', '_')
                path = f"{profile.user.id}/{int(time.time())}_{safe_name}"

                # Read file bytes (ensure pointer at start)
                uploaded_file.seek(0)
                file_bytes = uploaded_file.read()

                # Upload (upsert to overwrite if same path)
                supa.storage.from_(bucket).upload(path, file_bytes, {
                    'contentType': uploaded_file.content_type,
                    'upsert': True
                })

                # Get a public URL (assumes bucket is public)
                public_url = supa.storage.from_(bucket).get_public_url(path)

                # Save URL on profile for server-rendered pages
                profile.profile_picture_url = public_url
                profile.save(update_fields=['profile_picture_url'])
                print(f"[DEBUG] Supabase upload successful: {public_url}")
        except Exception as supa_err:
            print(f"[WARN] Supabase upload failed: {supa_err}")

        # Prefer Supabase URL if available, else fallback to local
        final_url = public_url or local_url
        return JsonResponse({'success': True, 'image_url': final_url})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@never_cache
@login_required
def api_update_personal_info(request):
    """Persist personal info fields to Profile"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=400)

    try:
        profile = request.user.profile
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()
        phone_number = request.POST.get('phone_number', '').strip()
        dob = request.POST.get('date_of_birth', '').strip()

        if not first_name or not last_name or not email:
            return JsonResponse({'success': False, 'error': 'First name, last name and email are required.'}, status=400)

        profile.first_name = first_name
        profile.last_name = last_name
        profile.email = email
        profile.phone_number = phone_number
        if dob:
            from datetime import datetime
            try:
                profile.date_of_birth = datetime.strptime(dob, '%Y-%m-%d').date()
            except Exception:
                return JsonResponse({'success': False, 'error': 'Invalid date format (YYYY-MM-DD).'}, status=400)
        else:
            profile.date_of_birth = None

        profile.save()

        # keep auth_user in sync
        request.user.first_name = first_name
        request.user.last_name = last_name
        request.user.email = email
        request.user.save(update_fields=['first_name', 'last_name', 'email'])

        return JsonResponse({'success': True})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@never_cache
@login_required
def api_update_academic_info(request):
    """Persist academic info fields to Profile"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=400)

    try:
        profile = request.user.profile
        major = request.POST.get('major', '').strip()
        academic_year = request.POST.get('academic_year', '').strip()
        expected_graduation = request.POST.get('expected_graduation', '').strip()
        current_gpa = request.POST.get('current_gpa', '').strip()

        profile.major = major
        profile.academic_year = academic_year

        if expected_graduation:
            from datetime import datetime
            try:
                profile.expected_graduation = datetime.strptime(expected_graduation, '%Y-%m-%d').date()
            except Exception:
                return JsonResponse({'success': False, 'error': 'Invalid date for expected graduation.'}, status=400)
        else:
            profile.expected_graduation = None

        if current_gpa:
            try:
                gpa = float(current_gpa)
                if gpa < 0 or gpa > 4.0:
                    return JsonResponse({'success': False, 'error': 'GPA must be between 0.00 and 4.00.'}, status=400)
                profile.current_gpa = round(gpa, 2)
            except Exception:
                return JsonResponse({'success': False, 'error': 'Invalid GPA value.'}, status=400)
        else:
            profile.current_gpa = None

        # Persist only updated fields
        update_fields = ['major', 'academic_year', 'expected_graduation', 'current_gpa']
        profile.save(update_fields=update_fields)

        # Return normalized values so UI can reflect exactly what was saved
        result = {
            'success': True,
            'major': profile.major or '',
            'academic_year': profile.academic_year or '',
            'expected_graduation': profile.expected_graduation.isoformat() if profile.expected_graduation else '',
            'current_gpa': f"{profile.current_gpa:.2f}" if profile.current_gpa is not None else '',
        }
        return JsonResponse(result)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
