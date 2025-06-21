from django.contrib import admin
from .models import Task, RecurringTask

# Registers models in admin panel

class TaskAdmin(admin.ModelAdmin):
    list_display = ['title']
    
class RecurringTaskAdmin(admin.ModelAdmin):
    list_display = ['title']


admin.site.register(Task, TaskAdmin)
admin.site.register(RecurringTask, RecurringTaskAdmin)