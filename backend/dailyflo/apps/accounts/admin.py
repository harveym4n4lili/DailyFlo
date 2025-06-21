from django.contrib import admin
from .models import CustomUser

# Registers models in admin panel

class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['display_name']

admin.site.register(CustomUser, CustomUserAdmin)