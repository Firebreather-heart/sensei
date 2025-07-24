import pytest
from unittest.mock import patch
from fastapi import status


class TestIntegration:
    """Integration tests for the complete workflow"""

    @pytest.mark.asyncio
    async def test_complete_user_workflow(self, async_client):
        """Test complete user workflow: register, login, create file, share file"""

        # Mock services for the entire workflow
        with patch('app.routers.auth_router.auth_service') as mock_auth, \
                patch('app.routers.filesystem_router.fs') as mock_fs, \
                patch('app.routers.filesystem_router.get_current_user') as mock_get_user, \
                patch('app.permissions.file_permissions.authorization_service') as mock_auth_service:

            # Setup mocks
            user_data = {
                "id": "test-user-id",
                "username": "testuser",
                "email": "test@example.com",
                "role": "user"
            }

            file_data = {
                "id": "test-file-id",
                "root": "testuser",
                "directory": False,
                "parent": None,
                "name": "test.py",
                "content": "print('Hello, World!')",
                "children": [],
                "can_view": ["testuser"],
                "can_edit": ["testuser"],
                "public": False
            }

            mock_auth.create_user.return_value = user_data
            mock_auth.authenticate_user.return_value = {
                "access_token": "test-token",
                "token_type": "bearer",
                "expires_in": 3600
            }
            mock_get_user.return_value = user_data
            mock_fs.create_file.return_value = file_data
            mock_fs.get_file.return_value = file_data
            mock_fs.share_file_with_user.return_value = True
            mock_auth_service.can_user_view_file.return_value = True
            mock_auth_service.can_user_edit_file.return_value = True

            # 1. Register user
            register_response = await async_client.post("/api/v1/auth/register", json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpassword123"
            })
            assert register_response.status_code == status.HTTP_201_CREATED

            # 2. Login
            login_response = await async_client.post("/api/v1/auth/login", json={
                "email": "test@example.com",
                "password": "testpassword123"
            })
            assert login_response.status_code == status.HTTP_200_OK
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 3. Create file
            create_response = await async_client.post(
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
                headers=headers
            )
            assert create_response.status_code == status.HTTP_201_CREATED

            # 4. Get file
            get_response = await async_client.get(
                "/api/v1/filesystem/files/test-file-id",
                headers=headers
            )
            assert get_response.status_code == status.HTTP_200_OK

            # 5. Share file
            share_response = await async_client.post(
                "/api/v1/filesystem/files/test-file-id/share",
                json={
                    "username": "targetuser",
                    "permissions": ["view"]
                },
                headers=headers
            )
            assert share_response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_api_documentation_endpoints(self, async_client):
        """Test that API documentation endpoints are accessible"""

        # Test root endpoint
        root_response = await async_client.get("/")
        assert root_response.status_code == status.HTTP_200_OK
        assert "Sensei Code Sharing Platform" in root_response.json()[
            "message"]

        # Test health endpoint
        with patch('main.FirebaseService') as mock_firebase:
            mock_firebase.return_value.db = True

            health_response = await async_client.get("/health")
            assert health_response.status_code == status.HTTP_200_OK
            assert health_response.json()["status"] in ["healthy", "unhealthy"]

        # Test API info endpoint
        api_info_response = await async_client.get("/api/v1")
        assert api_info_response.status_code == status.HTTP_200_OK
        assert "endpoints" in api_info_response.json()

    @pytest.mark.asyncio
    async def test_error_handling(self, async_client):
        """Test error handling for various scenarios"""

        # Test 404 for non-existent endpoint
        response = await async_client.get("/non-existent-endpoint")
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Test unauthorized access
        response = await async_client.get("/api/v1/filesystem/user/files/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
