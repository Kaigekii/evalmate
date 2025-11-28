from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    # Student Dashboard Routes (SPA)
    path('dashboard/student/', views.student_dashboard_view, name='student_dashboard'),
    
    # Faculty Dashboard Routes
    path('dashboard/faculty/', views.faculty_dashboard_view, name='faculty_dashboard'),
    path('dashboard/faculty/form-builder/', views.form_builder_view, name='form_builder'),
    path('dashboard/faculty/reports/', views.faculty_reports_view, name='faculty_reports'),
    path('dashboard/faculty/reports/<int:form_id>/', views.faculty_form_responses_view, name='faculty_form_responses'),
    path('dashboard/faculty/reports/<int:form_id>/responses/<int:response_id>/', views.faculty_response_detail_view, name='faculty_response_detail'),

    # Student form discovery / access
    path('forms/search/', views.student_search_forms, name='forms_search'),
    path('forms/<int:form_id>/', views.student_form_view, name='student_form_view'),
    path('forms/<int:form_id>/access/', views.student_form_access, name='student_form_access'),
    path('forms/<int:form_id>/submit/', views.student_form_submit, name='student_form_submit'),
    
    # New evaluation flow
    path('forms/<int:form_id>/eval/team-setup/', views.student_eval_team_setup, name='student_eval_team_setup'),
    path('forms/<int:form_id>/eval/evaluations/', views.student_eval_evaluations, name='student_eval_evaluations'),
    path('forms/<int:form_id>/eval/submit-evaluation/', views.student_eval_submit_evaluation, name='student_eval_submit_evaluation'),
    path('forms/<int:form_id>/eval/navigate/<int:teammate_index>/', views.student_eval_navigate_teammate, name='student_eval_navigate_teammate'),
    
    # API endpoints
    path('api/publish-form', views.api_publish_form, name='api_publish_form'),
    path('api/forms/<int:form_id>/duplicate/', views.duplicate_form_api, name='duplicate_form_api'),
    path('api/forms/<int:form_id>/delete/', views.delete_form_api, name='delete_form_api'),
    path('api/forms/<int:form_id>/publish/', views.publish_form_api, name='publish_form_api'),
    path('api/forms/<int:form_id>/unpublish/', views.unpublish_form_api, name='unpublish_form_api'),
    path('api/forms/<int:form_id>/details/', views.get_form_details_api, name='get_form_details_api'),
    
    # Student pending evaluations API
    path('api/student/pending-evaluations/', views.api_get_pending_evaluations, name='api_get_pending_evaluations'),
    path('api/student/pending-evaluations/<int:pending_id>/remove/', views.api_remove_pending_evaluation, name='api_remove_pending_evaluation'),
    path('api/student/evaluation-history/', views.api_get_evaluation_history, name='api_get_evaluation_history'),
    
    # Draft API endpoints
    path('api/student/draft/save/', views.api_save_draft, name='api_save_draft'),
    path('api/student/draft/<int:form_id>/', views.api_get_draft, name='api_get_draft'),
    path('api/student/draft/<int:form_id>/delete/', views.api_delete_draft, name='api_delete_draft'),
    
    # Profile API endpoints
    path('api/profile/upload-picture/', views.api_upload_profile_picture, name='api_upload_profile_picture'),
    path('api/profile/update-personal/', views.api_update_personal_info, name='api_update_personal_info'),
    path('api/profile/update-academic/', views.api_update_academic_info, name='api_update_academic_info'),
]