from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# create router for ViewSets
# register with empty string since the main urls.py already includes 'tasks/' prefix
# this creates endpoints at /tasks/ (list/create) and /tasks/{id}/ (detail)
# IMPORTANT: register specific paths (activity-logs, lists) BEFORE the empty '' route,
# otherwise the router matches "activity-logs" as a task UUID and returns 404
router = DefaultRouter()
router.register(r'activity-logs', views.ActivityLogViewSet, basename='activity-log')
router.register(r'lists', views.ListViewSet, basename='list')
router.register(r'', views.TaskViewSet, basename='task')

urlpatterns = [
    # include router URLs
    path('', include(router.urls)),
]