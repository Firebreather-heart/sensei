from app.services.authorization_service import AuthorizationService
from app.services.filesystem import FileSystem
from app.services.auth_service import AuthService
from app.services.firebase_service import FirebaseService
from main import app
import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock
import os

# Set test environment
os.environ["FIREBASE_KEY_PATH"] = "test_key.json"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Create an async test client for the FastAPI app"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_firebase_service():
    """Mock Firebase service for testing"""
    mock_service = Mock(spec=FirebaseService)
    mock_db = AsyncMock()
    mock_service.db = mock_db
    return mock_service


@pytest.fixture
def mock_auth_service():
    """Mock authentication service for testing"""
    return AsyncMock(spec=AuthService)


@pytest.fixture
def mock_filesystem():
    """Mock filesystem service for testing"""
    return AsyncMock(spec=FileSystem)


@pytest.fixture
def mock_authorization_service():
    """Mock authorization service for testing"""
    return AsyncMock(spec=AuthorizationService)


@pytest.fixture
def sample_user():
    """Sample user data for testing"""
    return {
        "id": "test-user-id",
        "username": "testuser",
        "email": "test@example.com",
        "role": "user",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_file():
    """Sample file data for testing"""
    return {
        "id": "test-file-id",
        "root": "testuser",
        "directory": False,
        "parent": None,
        "name": "test.py",
        "content": "print('Hello, World!')",
        "children": [],
        "can_view": ["testuser"],
        "can_edit": ["testuser"],
        "public": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_directory():
    """Sample directory data for testing"""
    return {
        "id": "test-dir-id",
        "root": "testuser",
        "directory": True,
        "parent": None,
        "name": "src",
        "content": "",
        "children": ["test-file-id"],
        "can_view": ["testuser"],
        "can_edit": ["testuser"],
        "public": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def jwt_token():
    """Sample JWT token for testing"""
    return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.test-signature"


@pytest.fixture
def auth_headers(jwt_token):
    """Authorization headers for testing"""
    return {"Authorization": f"Bearer {jwt_token}"}
