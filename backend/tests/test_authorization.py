import pytest
from unittest.mock import patch, AsyncMock


class TestAuthorizationService:
    """Test authorization service methods"""

    @pytest.mark.asyncio
    async def test_can_user_view_file_owner(self, mock_firebase_service, sample_file):
        """Test that file owner can view file"""
        from app.services.authorization_service import AuthorizationService
        from app.models.models import VirtualFile

        with patch('app.services.authorization_service.FirebaseService') as mock_firebase:
            mock_firebase.return_value = mock_firebase_service

            # Mock database response
            mock_doc = AsyncMock()
            mock_doc.exists = True
            mock_doc.to_dict.return_value = {
                "can_view": ["testuser", "otheruser"]}
            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value = mock_doc

            auth_service = AuthorizationService()
            file_obj = VirtualFile.model_validate(sample_file)

            result = await auth_service.can_user_view_file("testuser", file_obj)
            assert result is True

    @pytest.mark.asyncio
    async def test_can_user_view_file_not_authorized(self, mock_firebase_service, sample_file):
        """Test that unauthorized user cannot view file"""
        from app.services.authorization_service import AuthorizationService
        from app.models.models import VirtualFile

        with patch('app.services.authorization_service.FirebaseService') as mock_firebase:
            mock_firebase.return_value = mock_firebase_service

            # Mock database response
            mock_doc = AsyncMock()
            mock_doc.exists = True
            mock_doc.to_dict.return_value = {"can_view": ["testuser"]}
            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value = mock_doc

            auth_service = AuthorizationService()
            file_obj = VirtualFile.model_validate(sample_file)

            result = await auth_service.can_user_view_file("unauthorizeduser", file_obj)
            assert result is False

    @pytest.mark.asyncio
    async def test_add_user_to_view_list(self, mock_firebase_service, sample_file):
        """Test adding user to view list"""
        from app.services.authorization_service import AuthorizationService
        from app.models.models import VirtualFile

        with patch('app.services.authorization_service.FirebaseService') as mock_firebase:
            mock_firebase.return_value = mock_firebase_service

            # Mock database responses
            mock_doc_get = AsyncMock()
            mock_doc_get.exists = True
            mock_doc_get.to_dict.return_value = {"can_view": ["testuser"]}

            mock_doc_update = AsyncMock()

            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value = mock_doc_get
            mock_firebase_service.db.collection.return_value.document.return_value.update = mock_doc_update

            auth_service = AuthorizationService()
            file_obj = VirtualFile.model_validate(sample_file)

            await auth_service.add_user_to_view_list("newuser", file_obj)

            # Verify update was called
            mock_doc_update.assert_called_once()

    @pytest.mark.asyncio
    async def test_permission_required_decorator(self, mock_firebase_service, sample_file):
        """Test the permission required decorator"""
        from app.permissions.file_permissions import PermissionRequired

        with patch('app.permissions.file_permissions.fs') as mock_fs, \
                patch('app.permissions.file_permissions.authorization_service') as mock_auth:

            mock_fs.get_file.return_value = VirtualFile.model_validate(
                sample_file)
            mock_auth.can_user_view_file.return_value = True

            @PermissionRequired("view")
            async def test_function(file_id: str, current_user: dict):
                return {"message": "success"}

            result = await test_function(
                file_id="test-file-id",
                current_user={"id": "testuser", "username": "testuser"}
            )

            assert result["message"] == "success"
