from rest_framework import serializers
from .models import User, UserRole

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'date_joined']
        read_only_fields = fields

class ChangeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserRole.choices)


class UserStatsSerializer(serializers.Serializer):
    total_answers = serializers.IntegerField(read_only=True)
    total_upvotes = serializers.IntegerField(read_only=True)
    total_accepted_answers = serializers.IntegerField(read_only=True)

