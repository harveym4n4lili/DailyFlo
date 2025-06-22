from django.contrib import admin
from .models import CustomUser

# Registers models in admin panel

class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username']

admin.site.register(CustomUser, CustomUserAdmin)