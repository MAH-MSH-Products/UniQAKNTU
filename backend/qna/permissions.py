from rest_framework import permissions

class IsAuthorOrModerator(permissions.BasePermission):
    """
    Custom permission to only allow authors of an object to edit it,
    unless the user is a moderator or admin.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author, moderator, or admin.
        if hasattr(request.user, 'is_moderator') and (request.user.is_moderator() or request.user.is_admin()):
            return True
            
        return obj.author == request.user

class IsModeratorOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow moderators or admins to perform an action.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_moderator() or request.user.is_admin())

class IsModeratorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read-only access to anyone,
    but only allow moderators or admins to perform writes.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and (request.user.is_moderator() or request.user.is_admin())
