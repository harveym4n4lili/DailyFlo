from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import Task, RecurringTask
from .serializers import TaskSerializer, RecurringTaskSerializer

class TaskListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        tasks = Task.objects.all()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskSerializer(data=request.data) # send input data to serializer
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class TaskDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(Task, pk=pk)

    def get(self, request, pk):
        task = self.get_object(pk)
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    def put(self, request, pk):
        task = self.get_object(pk)
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecurringTaskDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(RecurringTask, pk=pk)

    def get(self, request, pk):
        task = self.get_object(pk)
        serializer = RecurringTaskSerializer(task)
        return Response(serializer.data)

    def put(self, request, pk):
        task = self.get_object(pk)
        serializer = RecurringTaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class RecurringTaskListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self):
        tasks = RecurringTask.objects.all()
        serializer = RecurringTaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RecurringTaskSerializer(data=request.data) # send input data to serializer
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # implement soft delete
    # def delete(self, request, pk):
    #     item = self.get_object(pk)
    #     item.delete()
    #     return Response(status=status.HTTP_204_NO_CONTENT)