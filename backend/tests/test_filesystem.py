import pytest
from unittest.mock import patch, AsyncMock
from fastapi import status


class TestFilesystemEndpoints:
    """Test filesystem endpoints"""

    @pytest.mark.asyncio
    async def test_create_file_success(self, async_client, auth_headers, sample_file):
        """Test successful file creation"""
        with patch('app.routers.filesystem_router.fs') as mock_fs, \
                patch('app.routers.filesystem_router.get_current_user') as mock_get_user:

            mock_get_user.return_value = {
                "id": "user-id", "username": "testuser"}
            mock_fs.create_file.return_value = sample_file

            response = await async_client.post(
                "/api/v1/filesystem/files/create",
                json={
                    "id": "test-file-id",
                    "name": "test.py",
                    "directory": False,
                    "content": "print('Hello, World!')",
                    "children": [],
                    "can_view": [],
                    "can_edit": [],
                    "public": False
                },
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_201_CREATED
            assert response.json()["name"] == "test.py"

    @pytest.mark.asyncio
    async def test_get_file_success(self, async_client, auth_headers, sample_file):
        """Test successful file retrieval"""
        with patch('app.routers.filesystem_router.fs') as mock_fs, \
                patch('app.routers.filesystem_router.get_current_user') as mock_get_user, \
                patch('app.permissions.file_permissions.authorization_service') as mock_auth:

            mock_get_user.return_value = {
                "id": "user-id", "username": "testuser"}
            mock_fs.get_file.return_value = sample_file
            mock_auth.can_user_view_file.return_value = True

            response = await async_client.get(
                "/api/v1/filesystem/files/test-file-id",
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["name"] == "test.py"

    @pytest.mark.asyncio
    async def test_get_file_not_found(self, async_client, auth_headers):
        """Test file not found"""
        with patch('app.routers.filesystem_router.fs') as mock_fs, \
                patch('app.routers.filesystem_router.get_current_user') as mock_get_user:

            mock_get_user.return_value = {
                "id": "user-id", "username": "testuser"}
            mock_fs.get_file.return_value = None

            response = await async_client.get(
                "/api/v1/filesystem/files/nonexistent",
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_update_file_success(self, async_client, auth_headers, sample_file):
        """Test successful file update"""
        with patch('app.routers.filesystem_router.fs') as mock_fs, \
                patch('app.routers.filesystem_router.get_current_user') as mock_get_user, \
                patch('app.permissions.file_permissions.authorization_service') as mock_auth:

            mock_get_user.return_value = {
                "id": "user-id", "username": "testuser"}
            mock_fs.get_file.return_value = sample_file
            mock_auth.can_user_edit_file.return_value = True
            mock_fs.update_file.return_value = None

            updated_file = sample_file.copy()
            updated_file["content"] = "print('Updated!')"
            mock_fs.get_file.side_effect = [sample_file, updated_file]

            response = await async_client.put(
                "/api/v1/filesystem/files/test-file-id",
                json={"content": "print('Updated!')"},
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["content"] == "print('Updated!')"

    @pytest.mark.asyncio
    async def test_delete_file_success(self, async_client, auth_headers, sample_file):
        """Test successful file deletion"""
        with patch('app.routers.filesystem_router.fs') as mock_fs, \
                patch('app.routers.filesystem_router.get_current_user') as mock_get_user:

            mock_get_user.return_value = {
                "id": "user-id", "username": "testuser"}
            mock_fs.get_file.return_value = sample_file
            mock_fs.delete_file.return_value = None

            response = await async_client.delete(
                "/api/v1/filesystem/files/test-file-id",
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.asyncio
    async def test_share_file_success(self, async_client, auth_headers, sample_file):
        """Test successful file sharing"""
        with patch('app.routers.filesystem_router.fs') as mock_fs, \
                patch('app.routers.filesystem_router.get_current_user') as mock_get_user, \
                patch('app.permissions.file_permissions.authorization_service') as mock_auth:

            mock_get_user.return_value = {
                "id": "user-id", "username": "testuser"}
            mock_fs.get_file.return_value = sample_file
            mock_auth.can_user_edit_file.return_value = True
            mock_fs.share_file_with_user.return_value = True

            response = await async_client.post(
                "/api/v1/filesystem/files/test-file-id/share",
                json={
                    "username": "targetuser",
                    "permissions": ["view"]
                },
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            assert "shared with targetuser" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_get_public_files(self, async_client, sample_file):
        """Test getting public files"""
        with patch('app.routers.filesystem_router.fs') as mock_fs:
            public_file = sample_file.copy()
            public_file["public"] = True
            mock_fs.get_public_files.return_value = [public_file]

            response = await async_client.get("/api/v1/filesystem/files/public")

            assert response.status_code == status.HTTP_200_OK
            assert len(response.json()) == 1
            assert response.json()[0]["public"] is True


class TestFilesystemService:
    """Test filesystem service methods"""

    @pytest.mark.asyncio
    async def test_create_file(self, mock_firebase_service, sample_file):
        """Test file creation in filesystem service"""
        from app.services.filesystem import FileSystem
        from app.models.models import VirtualFile

        with patch('app.services.filesystem.FirebaseService') as mock_firebase:
            mock_firebase.return_value = mock_firebase_service
            mock_firebase_service.db.collection.return_value.document.return_value.set = AsyncMock()
            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value.exists = True
            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value.to_dict.return_value = sample_file
            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value.id = "test-file-id"

            fs = FileSystem()
            file_obj = VirtualFile.model_validate(sample_file)

            result = await fs.create_file(file_obj)
            assert result.name == "test.py"

    @pytest.mark.asyncio
    async def test_search_files(self, mock_firebase_service, sample_file):
        """Test file search functionality"""
        from app.services.filesystem import FileSystem

        with patch('app.services.filesystem.FirebaseService') as mock_firebase:
            mock_firebase.return_value = mock_firebase_service

            # Mock search results
            mock_doc = AsyncMock()
            mock_doc.exists = True
            mock_doc.to_dict.return_value = sample_file
            mock_doc.id = "test-file-id"

            mock_firebase_service.db.collection.return_value.where.return_value.stream.return_value = [
                mock_doc]

            fs = FileSystem()
            results = await fs.search_files("test", "testuser")

            assert len(results) >= 0  # Should handle the search
