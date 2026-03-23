from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.tasks.models import Task
from apps.tasks.serializers import TaskListSerializer
from .models import List
from .serializers import ListSerializer, ListCreateSerializer, ListUpdateSerializer


class ListViewSet(viewsets.ModelViewSet):
    """
    ViewSet for list management
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['sort_order', 'name', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_queryset(self):
        """filter lists by current user"""
        return List.objects.filter(
            user=self.request.user,
            soft_deleted=False
        )
    
    def get_serializer_class(self):
        """return appropriate serializer based on action"""
        if self.action == 'create':
            return ListCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ListUpdateSerializer
        else:
            return ListSerializer
    
    def perform_create(self, serializer):
        """create list (user set in ListCreateSerializer.create)"""
        serializer.save()

    def perform_destroy(self, instance):
        """soft delete list; point tasks at inbox (null list) so they still show in Inbox"""
        Task.objects.filter(list=instance, user=instance.user).update(list=None)
        instance.soft_deleted = True
        instance.save(update_fields=['soft_deleted', 'updated_at'])

    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """tasks belonging to this list (same contract as former /tasks/lists/<id>/tasks/)"""
        list_obj = self.get_object()
        qs = Task.objects.filter(
            list=list_obj,
            user=request.user,
            soft_deleted=False,
        ).select_related('list')
        is_completed = request.query_params.get('completed')
        if is_completed is not None:
            qs = qs.filter(is_completed=is_completed.lower() == 'true')
        serializer = TaskListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def inbox(self, request):
        """get inbox (default) list"""
        try:
            inbox_list = List.objects.get(
                user=request.user,
                is_default=True,
                soft_deleted=False
            )
            serializer = ListSerializer(inbox_list)
            return Response(serializer.data)
        except List.DoesNotExist:
            return Response(
                {'error': 'Inbox list not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )