from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# create router for ViewSets
router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'lists', views.ListViewSet, basename='list')

urlpatterns = [
    # include router URLs
    path('', include(router.urls)),
]