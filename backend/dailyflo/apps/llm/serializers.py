from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    """One turn in the chat — user or assistant text from the client."""

    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField(max_length=8000, trim_whitespace=True)


class AssistantRequestSerializer(serializers.Serializer):
    """POST /llm/assistant/ body."""

    messages = ChatMessageSerializer(many=True, allow_empty=False)

    def validate_messages(self, value):
        if not any(msg['role'] == 'user' and msg['content'].strip() for msg in value):
            raise serializers.ValidationError('At least one non-empty user message is required.')
        return value


class TaskProposalSerializer(serializers.Serializer):
    """One validated proposal returned to the app (camelCase for frontend types)."""

    id = serializers.CharField()
    type = serializers.ChoiceField(choices=['create', 'update', 'delete'])
    summary = serializers.CharField()
    payload = serializers.DictField()


class AssistantResponseSerializer(serializers.Serializer):
    """Stable JSON shape the Expo app parses."""

    reply = serializers.CharField()
    proposals = TaskProposalSerializer(many=True)
    meta = serializers.DictField(required=False)
