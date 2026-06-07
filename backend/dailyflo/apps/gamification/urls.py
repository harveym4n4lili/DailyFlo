from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'goals', views.UserGoalViewSet, basename='gamification-goal')

urlpatterns = [
    path('summary/', views.GamificationSummaryView.as_view(), name='gamification-summary'),
    path('achievements/', views.GamificationAchievementsView.as_view(), name='gamification-achievements'),
    path('', include(router.urls)),
]
