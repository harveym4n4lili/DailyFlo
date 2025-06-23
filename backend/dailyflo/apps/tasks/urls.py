from django.urls import path
from .views import TaskListAPIView, TaskDetailAPIView

urlpatterns = [
    path('', TaskListAPIView.as_view(), name='tasks-list'),
    path('<int:pk>/', TaskDetailAPIView.as_view(), name='tasks-detail'),
    path('recurring', TaskListAPIView.as_view(), name='tasks-list'),
    path('recurring/<int:pk>/', TaskDetailAPIView.as_view(), name='tasks-detail'),
]