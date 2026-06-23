from django.urls import path

from apps.llm.views import LlmAssistantView

urlpatterns = [
    path('assistant/', LlmAssistantView.as_view(), name='llm-assistant'),
]
