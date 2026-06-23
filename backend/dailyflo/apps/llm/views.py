"""
LLM assistant API — authenticated proxy to Gemini.

Flow: validate request → load task context → call provider → validate proposals → JSON response.
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

from apps.llm.serializers import AssistantRequestSerializer, AssistantResponseSerializer
from apps.llm.services.exceptions import LlmConfigurationError, LlmProviderError, LlmTimeoutError
from apps.llm.services.prompts import build_system_prompt, build_user_content
from apps.llm.services.proposal_validator import validate_proposals
from apps.llm.services.provider import call_assistant, parse_assistant_json
from apps.llm.services.task_context import build_task_context, format_context_block


class LlmAssistantView(APIView):
    """
    POST /llm/assistant/

    Accepts chat messages; returns assistant reply + task proposals for user confirmation.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AssistantRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        messages = serializer.validated_data['messages']

        # cap total user text length — protects cost and latency
        total_chars = sum(len(m['content']) for m in messages)
        if total_chars > settings.LLM_MAX_INPUT_CHARS:
            return Response(
                {'detail': f'Message too long (max {settings.LLM_MAX_INPUT_CHARS} characters).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        context = build_task_context(user=request.user)
        context_block = format_context_block(context)
        system_prompt = build_system_prompt()
        user_content = build_user_content(context_block=context_block, messages=messages)

        try:
            raw_json = call_assistant(system_prompt=system_prompt, user_content=user_content)
        except LlmConfigurationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except LlmTimeoutError:
            return Response(
                {'detail': 'Assistant request timed out. Please try again.'},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except LlmProviderError:
            return Response(
                {'detail': 'Assistant is temporarily unavailable. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        parsed = parse_assistant_json(raw_json)
        raw_proposals = parsed.get('proposals', [])
        proposals = validate_proposals(raw_proposals, request.user)

        reply = parsed.get('reply', '')
        # if model produced proposals we dropped (bad ids), explain instead of silent empty cards
        if isinstance(raw_proposals, list) and len(raw_proposals) > 0 and len(proposals) == 0:
            if 'trouble formatting' not in reply.lower():
                reply = (
                    f'{reply} '.strip()
                    + 'I could not match those tasks to your list — try naming them or asking for one change at a time.'
                ).strip()

        response_data = {
            'reply': reply,
            'proposals': proposals,
            'meta': {
                'provider': settings.LLM_PROVIDER,
                'model': settings.GEMINI_MODEL,
            },
        }

        out = AssistantResponseSerializer(response_data)
        return Response(out.data)
