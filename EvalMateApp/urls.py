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
    # API endpoints
    path('api/publish-form', views.api_publish_form, name='api_publish_form'),
]