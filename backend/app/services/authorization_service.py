from enum import Enum 

from .firebase_service import FirebaseService
from ..models.users import User, UserCreate, UserUpdate, UserLogin, Token, Token, UserSecure
from ..models.models import VirtualFile

class AuthorizationService:
    def __init__(self):
        self.db = FirebaseService().db

    async def _get_user_view_list(self, file:VirtualFile):
        """
        Get the list of user IDs who can view the file.
        """
        doc_ref = self.db.collection('files').document(file.id)
        doc = await doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data:
                return data.get('can_view', [])
        return []
    
    async def _get_user_edit_list(self, file:VirtualFile):
        """
        Get the list of user IDs who can edit the file.
        """
        doc_ref = self.db.collection('files').document(file.id)
        doc = await doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data:
                return data.get('can_edit', [])
        return []
    
    async def can_user_view_file(self, user_id: str, file: VirtualFile) -> bool:
        """
        Check if a user can view a file.
        """
        can_view = await self._get_user_view_list(file)
        return user_id in can_view
    
    async def can_user_edit_file(self, user_id: str, file: VirtualFile) -> bool:
        """
        Check if a user can edit a file.
        """
        can_edit = await self._get_user_edit_list(file)
        return user_id in can_edit
    
    async def add_user_to_view_list(self, user_id: str, file: VirtualFile) -> None:
        """
        Add a user to the view list of a file.
        """
        can_view = await self._get_user_view_list(file)
        if user_id not in can_view:
            can_view.append(user_id)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_view': can_view})

    async def add_user_to_edit_list(self, user_id: str, file: VirtualFile) -> None:
        """
        Add a user to the edit list of a file.
        """
        can_edit = await self._get_user_edit_list(file)
        if user_id not in can_edit:
            can_edit.append(user_id)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_edit': can_edit})

    async def remove_user_from_view_list(self, user_id: str, file: VirtualFile) -> None:
        """
        Remove a user from the view list of a file.
        """
        can_view = await self._get_user_view_list(file)
        if user_id in can_view:
            can_view.remove(user_id)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_view': can_view})

    async def remove_user_from_edit_list(self, user_id: str, file: VirtualFile) -> None:
        """
        Remove a user from the edit list of a file.
        """
        can_edit = await self._get_user_edit_list(file)
        if user_id in can_edit:
            can_edit.remove(user_id)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_edit': can_edit})
    
    async def get_user_permissions(self, user_id: str, file: VirtualFile) -> dict:
        """
        Get the permissions of a user for a specific file.
        """
        can_view = await self.can_user_view_file(user_id, file)
        can_edit = await self.can_user_edit_file(user_id, file)
        return {
            'can_view': can_view,
            'can_edit': can_edit
        }

   