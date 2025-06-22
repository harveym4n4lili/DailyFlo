from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from .models import CustomUser

class LoginCustomUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        user = authenticate(
            username = attrs.get('username'),
            password = attrs.get('password')
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        attrs['user'] = user
        return attrs

class RegisterCustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min=8)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'password', 'first_name', 'last_name',
                  'display_name', 'bio']
        
    def create(self, validated_data):
        return CustomUser.objects.create(**validated_data)