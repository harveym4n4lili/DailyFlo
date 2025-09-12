from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
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
        """create list with current user"""
        serializer.save(user=self.request.user)
    
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