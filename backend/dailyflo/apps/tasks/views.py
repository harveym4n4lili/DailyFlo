from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q
from .models import Task
from .serializers import (
    TaskListSerializer, TaskDetailSerializer, TaskCreateSerializer,
    TaskUpdateSerializer, TaskCompleteSerializer, ListSerializer, ListCreateSerializer
)
from apps.lists.models import List


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for task management
    
    Tasks are automatically filtered by the authenticated user.
    Users can only see and manage their own tasks.
    """
    # Require authentication to access tasks
    # Only authenticated users can view, create, update, or delete tasks
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_completed', 'color', 'priority_level', 'routine_type', 'list']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority_level', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """filter tasks by current user"""
        # Filter tasks by the authenticated user
        # Users can only see their own tasks
        return Task.objects.filter(
            user=self.request.user,
            soft_deleted=False
        ).select_related('list')
    
    def get_serializer_class(self):
        """return appropriate serializer based on action"""
        if self.action == 'list':
            return TaskListSerializer
        elif self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        else:
            return TaskDetailSerializer
    
    def perform_create(self, serializer):
        """create task with current user"""
        serializer.save(user=self.request.user)
    
    def perform_destroy(self, instance):
        """soft delete task instead of hard delete"""
        # Instead of actually deleting, mark as soft deleted
        # This allows for recovery and maintains data integrity
        instance.soft_deleted = True
        instance.save()
    
    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """mark task as completed"""
        task = self.get_object()
        serializer = TaskCompleteSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """get today's tasks"""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            Q(due_date__date=today) | Q(due_date__isnull=True)
        ).exclude(is_completed=True)
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """get overdue tasks"""
        now = timezone.now()
        tasks = self.get_queryset().filter(
            due_date__lt=now,
            is_completed=False
        )
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """get completed tasks"""
        tasks = self.get_queryset().filter(is_completed=True)
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)


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
        else:
            return ListSerializer
    
    def perform_create(self, serializer):
        """create list with current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """get tasks for a specific list"""
        list_obj = self.get_object()
        tasks = Task.objects.filter(
            list=list_obj,
            user=request.user,
            soft_deleted=False
        ).select_related('list')
        
        # apply filters
        is_completed = request.query_params.get('completed')
        if is_completed is not None:
            tasks = tasks.filter(is_completed=is_completed.lower() == 'true')
        
        serializer = TaskListSerializer(tasks, many=True)
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