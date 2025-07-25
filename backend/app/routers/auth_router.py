from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..services.auth_service import AuthService
from ..models.users import User, UserCreate, UserUpdate, UserLogin, Token, TokenData, UserSecure

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
security = HTTPBearer()
auth_service = AuthService()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    user = await auth_service.get_current_user(credentials.credentials)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post('/register', response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate) -> User:
    try:
        user = await auth_service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the user"
        )
    
@router.post('/login', response_model=Token)
async def login(user_login: UserLogin) -> Token:
    user_token = await auth_service.authenticate_user(user_login)
    if not user_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_token 

@router.get('me', response_model = User)
async def get_me(current_user: UserSecure = Depends(get_current_user)) -> UserSecure:
    """
    Get the current authenticated user.
    """
    return current_user

@router.put('/me', response_model=User)
async def update_me(user_update: UserUpdate, current_user: User = Depends(get_current_user)) -> User:
    """
    Update the current authenticated user.
    """
    try:
        updated_user = await auth_service.update_user(current_user.id, user_update)
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the user"
        )
    
@router.get('/users/all/', response_model=list[UserSecure])
async def get_all_users(current_user: UserSecure = Depends(get_current_user)) -> list[UserSecure]:
    """
    Get all users in the system.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view all users"
        )
    
    users = await auth_service.get_all_users()
    return users #type:ignore

__all__ = ["get_current_user"]