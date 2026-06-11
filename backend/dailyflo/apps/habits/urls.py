from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'', views.HabitViewSet, basename='habit')

urlpatterns = [
    path('<uuid:habit_id>/stats/', views.HabitStatsView.as_view(), name='habit-stats'),
    path('', include(router.urls)),
]
