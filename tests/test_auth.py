import pytest
from unittest.mock import patch, AsyncMock
from fastapi import status


class TestAuthEndpoints:
    """Test authentication endpoints"""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client, sample_user):
        """Test successful user registration"""
        with patch('app.routers.auth_router.auth_service') as mock_auth:
            mock_auth.create_user.return_value = sample_user

            response = await async_client.post("/api/v1/auth/register", json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpassword123"
            })

            assert response.status_code == status.HTTP_201_CREATED
            assert response.json()["username"] == "testuser"
            assert response.json()["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, async_client):
        """Test registration with duplicate username"""
        with patch('app.routers.auth_router.auth_service') as mock_auth:
            mock_auth.create_user.side_effect = ValueError(
                "Username already exists")

            response = await async_client.post("/api/v1/auth/register", json={
                "username": "existinguser",
                "email": "test@example.com",
                "password": "testpassword123"
            })

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "Username already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_success(self, async_client):
        """Test successful login"""
        with patch('app.routers.auth_router.auth_service') as mock_auth:
            mock_auth.authenticate_user.return_value = {
                "access_token": "test-token",
                "token_type": "bearer",
                "expires_in": 3600
            }

            response = await async_client.post("/api/v1/auth/login", json={
                "email": "test@example.com",
                "password": "testpassword123"
            })

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["access_token"] == "test-token"
            assert response.json()["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, async_client):
        """Test login with invalid credentials"""
        with patch('app.routers.auth_router.auth_service') as mock_auth:
            mock_auth.authenticate_user.return_value = None

            response = await async_client.post("/api/v1/auth/login", json={
                "email": "test@example.com",
                "password": "wrongpassword"
            })

            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_get_me_success(self, async_client, sample_user, auth_headers):
        """Test getting current user info"""
        with patch('app.routers.auth_router.get_current_user') as mock_get_user:
            mock_get_user.return_value = sample_user

            response = await async_client.get("/api/v1/auth/me", headers=auth_headers)

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["username"] == "testuser"

    @pytest.mark.asyncio
    async def test_get_me_unauthorized(self, async_client):
        """Test getting current user without authorization"""
        response = await async_client.get("/api/v1/auth/me")

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestAuthService:
    """Test authentication service methods"""

    @pytest.mark.asyncio
    async def test_create_user(self, mock_firebase_service, sample_user):
        """Test user creation"""
        from app.services.auth_service import AuthService

        with patch('app.services.auth_service.FirebaseService') as mock_firebase:
            mock_firebase.return_value = mock_firebase_service
            mock_firebase_service.db.collection.return_value.document.return_value.set = AsyncMock()
            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value.exists = True
            mock_firebase_service.db.collection.return_value.document.return_value.get.return_value.to_dict.return_value = sample_user

            auth_service = AuthService()

            from app.models.users import UserCreate
            user_data = UserCreate(
                username="testuser",
                email="test@example.com",
                password="testpassword123"
            )

            result = await auth_service.create_user(user_data)
            assert result.username == "testuser"

    @pytest.mark.asyncio
    async def test_hash_password(self):
        """Test password hashing"""
        from app.services.auth_service import AuthService

        auth_service = AuthService()
        password = "testpassword123"
        hashed = auth_service._hash_password(password)

        assert hashed != password
        assert auth_service._verify_password(password, hashed)

    @pytest.mark.asyncio
    async def test_create_access_token(self):
        """Test JWT token creation"""
        from app.services.auth_service import AuthService

        auth_service = AuthService()
        data = {"sub": "testuser", "email": "test@example.com"}
        token = auth_service._create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0
