from django.urls import path
from .views import TaskListAPIView, TaskDetailAPIView, ToggleDeleteTaskAPIView, RecurringTaskListAPIView, RecurringTaskDetailAPIView, ToggleDeleteRecurringTaskAPIView

urlpatterns = [
    path('', TaskListAPIView.as_view(), name='tasks-list'),
    path('<int:pk>/', TaskDetailAPIView.as_view(), name='tasks-detail'),
    path('<int:pk>/toggle-delete/', ToggleDeleteTaskAPIView.as_view(), name='task-delete'),
    path('recurring/', RecurringTaskListAPIView.as_view(), name='recurring-tasks-list'),
    path('recurring/<int:pk>/', TaskDetailAPIView.as_view(), name='recurring-tasks-detail'),
    path('recurring/<int:pk>/toggle-delete/', ToggleDeleteRecurringTaskAPIView.as_view(), name='recurring-task-delete'),
]