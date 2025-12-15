from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# create router for ViewSets
# register with empty string since the main urls.py already includes 'tasks/' prefix
# this creates endpoints at /tasks/ (list/create) and /tasks/{id}/ (detail)
router = DefaultRouter()
router.register(r'', views.TaskViewSet, basename='task')
router.register(r'lists', views.ListViewSet, basename='list')

urlpatterns = [
    # include router URLs
    path('', include(router.urls)),
]