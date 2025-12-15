# Django Backend: Temporarily Bypass Auth for Testing

A quick reference guide for temporarily disabling authentication in Django REST Framework endpoints during development and testing.

---

## ⚠️ Important Notes

- **Only for development/testing** - Never use these methods in production
- **Always revert changes** - Remove bypasses before committing to version control
- **Use feature flags** - Consider using environment variables for safer toggling
- **Document your changes** - Add comments explaining why auth is disabled

---

## Method 1: AllowAny Permission (Recommended)

**Best for:** Testing specific endpoints without affecting global settings

### Step-by-Step

1. **Open your ViewSet file** (e.g., `apps/tasks/views.py`)

2. **Import AllowAny:**
   ```python
   from rest_framework.permissions import AllowAny
   ```

3. **Add to your ViewSet class:**
   ```python
   class TaskViewSet(viewsets.ModelViewSet):
       # TEMPORARY: AllowAny for testing - REMOVE BEFORE PRODUCTION
       permission_classes = [AllowAny]
       
       # ... rest of your ViewSet code
   ```

4. **Test your endpoint** - It will now accept requests without authentication

5. **Revert when done:**
   - Remove the `permission_classes` line
   - Or change back to your original permissions (e.g., `[IsAuthenticated]`)

### Example

**Before:**
```python
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    # Uses default authentication from settings
```

**After (temporary):**
```python
from rest_framework.permissions import AllowAny

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    # TEMPORARY: Bypass auth for testing
    permission_classes = [AllowAny]
```

---

## Method 2: Per-Action Permission Override

**Best for:** Testing specific actions (list, create, retrieve) while keeping others protected

### Step-by-Step

1. **Import AllowAny:**
   ```python
   from rest_framework.permissions import AllowAny
   ```

2. **Override get_permissions method:**
   ```python
   class TaskViewSet(viewsets.ModelViewSet):
       def get_permissions(self):
           # TEMPORARY: Allow list action without auth for testing
           if self.action == 'list':
               return [AllowAny()]
           return super().get_permissions()
   ```

### Example

```python
from rest_framework.permissions import AllowAny, IsAuthenticated

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def get_permissions(self):
        # TEMPORARY: Allow GET requests without auth
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        # Keep other actions protected
        return [IsAuthenticated()]
```

---

## Method 3: Environment-Based Toggle

**Best for:** Safer testing with easy on/off switching

### Step-by-Step

1. **Add to Django settings.py:**
   ```python
   import os
   
   # TEMPORARY: Allow bypassing auth in development
   BYPASS_AUTH_FOR_TESTING = os.environ.get('BYPASS_AUTH', 'False') == 'True'
   ```

2. **Create custom permission class:**
   ```python
   # In your views.py or permissions.py
   from rest_framework.permissions import BasePermission
   from django.conf import settings
   
   class ConditionalAuth(BasePermission):
       """
       TEMPORARY: Allows bypassing auth when BYPASS_AUTH env var is True
       """
       def has_permission(self, request, view):
           if settings.BYPASS_AUTH_FOR_TESTING:
               return True
           return request.user and request.user.is_authenticated
   ```

3. **Use in ViewSet:**
   ```python
   from .permissions import ConditionalAuth
   
   class TaskViewSet(viewsets.ModelViewSet):
       permission_classes = [ConditionalAuth]
   ```

4. **Toggle with environment variable:**
   ```bash
   # Enable bypass
   export BYPASS_AUTH=True
   python manage.py runserver
   
   # Disable bypass
   export BYPASS_AUTH=False
   python manage.py runserver
   ```

---

## Method 4: Global Settings Override (Not Recommended)

**Best for:** Quick testing of all endpoints (use sparingly)

### Step-by-Step

1. **Open `config/settings.py`**

2. **Modify REST_FRAMEWORK settings:**
   ```python
   REST_FRAMEWORK = {
       'DEFAULT_AUTHENTICATION_CLASSES': (
           # TEMPORARY: Comment out for testing
           # 'rest_framework_simplejwt.authentication.JWTAuthentication',
       ),
       'DEFAULT_PERMISSION_CLASSES': (
           # TEMPORARY: Allow all for testing
           'rest_framework.permissions.AllowAny',
           # Original: 'rest_framework.permissions.IsAuthenticated',
       )
   }
   ```

3. **Revert immediately after testing**

### ⚠️ Warning

- This affects **ALL** API endpoints
- Very easy to forget to revert
- Not recommended unless testing everything at once

---

## Method 5: Custom Authentication Class (Advanced)

**Best for:** More control over when auth is bypassed

### Step-by-Step

1. **Create custom authentication class:**
   ```python
   # In your views.py or authentication.py
   from rest_framework.authentication import BaseAuthentication
   from django.conf import settings
   
   class TestingAuthentication(BaseAuthentication):
       """
       TEMPORARY: Allows requests without tokens when in testing mode
       """
       def authenticate(self, request):
           # Check if we're in testing mode
           if settings.DEBUG and getattr(settings, 'BYPASS_AUTH_FOR_TESTING', False):
               # Return a dummy user or None
               return (None, None)  # Anonymous user
           # Otherwise, use normal JWT auth
           return None
   ```

2. **Use in ViewSet:**
   ```python
   from rest_framework_simplejwt.authentication import JWTAuthentication
   from .authentication import TestingAuthentication
   
   class TaskViewSet(viewsets.ModelViewSet):
       authentication_classes = [TestingAuthentication, JWTAuthentication]
       permission_classes = [AllowAny]  # Still need this
   ```

---

## Quick Reference: Common Permission Classes

| Permission Class | What It Does |
|-----------------|--------------|
| `AllowAny` | No authentication required (public) |
| `IsAuthenticated` | User must be logged in |
| `IsAdminUser` | User must be admin/staff |
| `IsAuthenticatedOrReadOnly` | Auth required for write, public for read |
| `DjangoModelPermissions` | Uses Django's permission system |

---

## Testing Checklist

Before disabling auth:

- [ ] Identify which endpoint(s) need testing
- [ ] Choose the appropriate method (Method 1 recommended)
- [ ] Add clear comments marking it as TEMPORARY
- [ ] Test your endpoint
- [ ] **Immediately revert the change**
- [ ] Verify auth is working again

---

## Reverting Changes

### Quick Revert Steps

1. **Remove `permission_classes` override** from ViewSet
2. **Restart Django server** (if needed)
3. **Test that auth is required again** (should get 401 without token)
4. **Commit your actual changes** (not the bypass)

### Verification

Test that auth is working:
```bash
# Should return 401 Unauthorized
curl http://localhost:8000/tasks/tasks/

# Should return 200 OK (if you have a valid token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/tasks/tasks/
```

---

## Common Issues

### Issue: Still getting 401 after adding AllowAny

**Solution:** 
- Check that you're modifying the correct ViewSet
- Verify the import statement is correct
- Restart Django server
- Check if there's a global permission class overriding it

### Issue: Forgot to revert before committing

**Solution:**
- Use git to check recent commits: `git log --oneline`
- Revert the commit: `git revert <commit-hash>`
- Or manually remove the bypass code

### Issue: Want to test with specific user

**Solution:**
- Instead of bypassing auth, create a test user
- Generate a token for that user
- Use the token in your frontend/API client

---

## Best Practices

1. **Use Method 1 (AllowAny)** - Simplest and safest
2. **Add TODO comments** - Mark with `# TODO: Remove before production`
3. **Test immediately** - Don't leave bypasses in code
4. **Use version control** - Commit working code, not bypasses
5. **Document why** - Add comments explaining what you're testing

---

## Example: Complete Temporary Setup

```python
# apps/tasks/views.py

from rest_framework import viewsets
from rest_framework.permissions import AllowAny  # TEMPORARY import
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    """
    Task ViewSet
    
    TEMPORARY NOTE: Auth bypassed for testing fetchTasks integration.
    TODO: Remove AllowAny and restore IsAuthenticated before production.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    # TEMPORARY: Bypass auth for testing - REMOVE THIS LINE
    permission_classes = [AllowAny]
    
    # Original (uncomment when done testing):
    # permission_classes = [IsAuthenticated]
```

---

## Summary

**Quickest Method:** Add `permission_classes = [AllowAny]` to your ViewSet

**Safest Method:** Use environment variable toggle (Method 3)

**Remember:** Always revert before committing!

---

*Last updated: 2025-01-20*

