from functools import wraps
from typing import Callable
from fastapi import HTTPException, status

from ..services.authorization_service import AuthorizationService
from ..services.filesystem import FileSystem


fs = FileSystem()
authorization_service = AuthorizationService()


class PermissionRequired:
    def __init__(self, permission: str):
        self.permission = permission

    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            file_id = kwargs.get('file_id')
            current_user = kwargs.get('current_user')

            if not file_id or not current_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing file_id or current_user"
                )

     
            file = await fs.get_file(file_id)

            if not file:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File not found"
                )

            has_permission = False
            if self.permission == "view":
                has_permission = await authorization_service.can_user_view_file(current_user.id, file)
            elif self.permission == "edit":
                has_permission = await authorization_service.can_user_edit_file(current_user.id, file)

            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You don't have {self.permission} permission for this file"
                )

            return await func(*args, **kwargs)

        return wrapper
