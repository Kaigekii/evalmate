from django.contrib import admin
from .models import Profile, FormTemplate, FormResponse, ResponseAnswer, PendingEvaluation, DraftResponse


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'account_type', 'institution', 'department')


@admin.register(FormTemplate)
class FormTemplateAdmin(admin.ModelAdmin):
	list_display = ('title', 'course_id', 'created_by', 'created_at', 'privacy')
	search_fields = ('title', 'course_id', 'institution')


@admin.register(FormResponse)
class FormResponseAdmin(admin.ModelAdmin):
	list_display = ('form', 'submitted_by', 'submitted_at', 'is_read')
	list_filter = ('is_read',)


@admin.register(ResponseAnswer)
class ResponseAnswerAdmin(admin.ModelAdmin):
	list_display = ('response', 'question')


@admin.register(PendingEvaluation)
class PendingEvaluationAdmin(admin.ModelAdmin):
	list_display = ('student', 'form', 'added_at', 'status')


@admin.register(DraftResponse)
class DraftResponseAdmin(admin.ModelAdmin):
	list_display = ('student', 'form', 'teammate_name', 'last_saved')
	search_fields = ('student__user__username', 'form__title')
