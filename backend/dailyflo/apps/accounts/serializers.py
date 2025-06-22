from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'password', 'first_name', 'last_name',
                  'full_name', 'display_name', 'bio']
        
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
# Login serializer not needed as we are using SimpleJWT built in methods for login
# class LoginCustomUserSerializer(serializers.Serializer):
#     username = serializers.CharField()
#     password = serializers.CharField(write_only=True)
    
#     def validate(self, attrs):
#         user = authenticate(
#             username = attrs.get('username'),
#             password = attrs.get('password')
#         )
#         if not user:
#             raise serializers.ValidationError("Invalid username or password.")
#         attrs['user'] = user
#         return attrs

class RegisterCustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min=8)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'password', 'first_name', 'last_name',
                  'display_name', 'bio']
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = user(**validated_data)
        user.set_password(password)
        user.save()
        return user