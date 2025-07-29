from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List

from ..services.filesystem import FileSystem
from ..services.authorization_service import AuthorizationService
from ..models.models import VirtualFile
from ..models.users import UserSecure
from ..permissions.file_permissions import PermissionRequired

from .auth_router import get_current_user


router = APIRouter(prefix="/api/v1/filesystem", tags=["filesystem"])
fs = FileSystem()
authorization_service = AuthorizationService()


class ShareFileRequest(BaseModel):
    username: str
    permissions: List[str]  # ["view", "edit"]


class ShareWithMultipleRequest(BaseModel):
    usernames: List[str]
    permissions: List[str]


@router.get('/user/files/', response_model=list[VirtualFile], status_code=status.HTTP_200_OK,)
async def get_user_files(current_user: UserSecure = Depends(get_current_user)) -> list[VirtualFile]:
    files = await fs.get_user_files(current_user.username)
    if not files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No files found for the user"
        )
    return files


@router.get('/files/public', response_model=List[VirtualFile])
async def get_public_files(limit: int = 50):
    """Get public files (no authentication required)"""
    try:
        public_files = await fs.get_public_files(limit)
        return public_files
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting public files: {str(e)}"
        )


@router.get('/files/shared-with-me', response_model=List[VirtualFile])
async def get_shared_files(current_user: UserSecure = Depends(get_current_user)):
    """Get files shared with the current user"""
    try:
        shared_files = await fs.get_shared_files(current_user.username)
        return shared_files
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting shared files: {str(e)}"
        )


@router.post('/files/create', response_model=VirtualFile, status_code=status.HTTP_201_CREATED)
async def create_file(
        file_data: dict,
        current_user: UserSecure = Depends(get_current_user)) -> VirtualFile:
    file_data['root'] = current_user.username

    try:
        file = VirtualFile.model_validate(file_data)
        created_file = await fs.create_file(file)
        return created_file
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating file: {str(e)}"
        )


@router.get("/files/public/{file_id}", response_model=VirtualFile, status_code=status.HTTP_200_OK)
async def get_public_file(file_id: str) -> VirtualFile:
    """
    Get a public file by its ID.
    """
    file = await fs.get_file(file_id)
    if not file or not file.public:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public file not found"
        )
    return file


@router.get('/files/{file_id}', response_model=VirtualFile, status_code=status.HTTP_200_OK)
@PermissionRequired(permission="view")
async def get_file(file_id: str, current_user: UserSecure = Depends(get_current_user)) -> VirtualFile:
    file = await fs.get_file(file_id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return file


@router.post('/files/{file_id}/share', status_code=status.HTTP_200_OK)
@PermissionRequired(permission="edit")  # Only file owners/editors can share
async def share_file(
    file_id: str,
    share_request: ShareFileRequest,
    current_user: UserSecure = Depends(get_current_user)
):
    """Share a file with another user"""
    try:
        success = await fs.share_file_with_user(
            current_user.id,
            file_id,
            share_request.username,
            share_request.permissions
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to share file. User may not exist."
            )

        return {"message": f"File shared with {share_request.username}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sharing file: {str(e)}"
        )


@router.put('/files/{file_id}/public', status_code=status.HTTP_200_OK)
@PermissionRequired(permission="edit")
async def toggle_file_public(
    file_id: str,
    make_public: bool,
    current_user: UserSecure = Depends(get_current_user)
):
    """Make a file public or private"""
    try:
        if make_public:
            success = await fs.make_file_public(current_user.username, file_id)
        else:
            success = await fs.make_file_private(current_user.username, file_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update file visibility"
            )

        visibility = "public" if make_public else "private"
        return {"message": f"File is now {visibility}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating file visibility: {str(e)}"
        )


@router.post('/files/{file_id}/share-multiple', status_code=status.HTTP_200_OK)
@PermissionRequired(permission="edit")
async def share_file_with_multiple(
    file_id: str,
    share_request: ShareWithMultipleRequest,
    current_user: UserSecure = Depends(get_current_user)
):
    """Share a file with multiple users"""
    results = []
    for username in share_request.usernames:
        try:
            success = await fs.share_file_with_user(
                current_user.id, file_id, username, share_request.permissions
            )
            results.append({
                "username": username,
                "success": success,
                "message": "Shared successfully" if success else "Failed to share"
            })
        except Exception as e:
            results.append({
                "username": username,
                "success": False,
                "message": str(e)
            })

    return {"results": results}


@router.delete('/files/{file_id}/share/{username}', status_code=status.HTTP_200_OK)
@PermissionRequired(permission="edit")
async def revoke_file_access(
    file_id: str,
    username: str,
    current_user: UserSecure = Depends(get_current_user)
):
    """Revoke a user's access to a file"""
    try:
        success = await fs.revoke_user_access(
            current_user.id, file_id, username
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to revoke access"
            )

        return {"message": f"Access revoked for {username}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error revoking access: {str(e)}"
        )


@router.get('/files/{file_id}/permissions', response_model=dict)
@PermissionRequired(permission="view")
async def get_file_permissions(
    file_id: str,
    current_user: UserSecure = Depends(get_current_user)
):
    """Get file permissions and sharing info"""
    try:
        file = await fs.get_file(file_id)
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        return {
            "file_id": file_id,
            "owner": file.root,
            "is_public": file.public,
            "can_view": file.can_view,
            "can_edit": file.can_edit,
            "is_owner": file.root == current_user.username
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting permissions: {str(e)}"
        )


@router.put('/files/{file_id}', response_model=VirtualFile, status_code=status.HTTP_200_OK)
@PermissionRequired(permission="edit")
async def update_file(
        file_id: str,
        file_data: dict,
        current_user: UserSecure = Depends(get_current_user)) -> VirtualFile:

    file = await fs.get_file(file_id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    try:
        new_content = file_data.get('content')
        if new_content is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content is required to update the file"
            )
        await fs.update_file(file_id, new_content)
        updated_file = await fs.get_file(file_id)
        if not updated_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Failed to update file"
            )
        return updated_file
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating file: {str(e)}"
        )


@router.delete('/files/{file_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
        file_id: str,
        current_user: UserSecure = Depends(get_current_user)) -> None:

    file = await fs.get_file(file_id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if file.root != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this file"
        )

    try:
        await fs.delete_file(file_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting file: {str(e)}"
        )


@router.get('/search', response_model=List[VirtualFile])
async def search_files(
    query: str,
    current_user: UserSecure = Depends(get_current_user),
    include_shared: bool = True,
    include_public: bool = True
):
    """Search for files by name or content"""
    try:
        results = await fs.search_files(
            query,
            current_user.username,
            include_shared,
            include_public
        )

        # Filter results based on view permissions
        accessible_files = []
        for file in results:
            can_view = await authorization_service.can_user_view_file(current_user.id, file)
            if can_view:
                accessible_files.append(file)
        return accessible_files
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search error: {str(e)}"
        )


@router.get('/user/tree', response_model=dict)
async def get_file_tree(current_user: UserSecure = Depends(get_current_user)):
    """Get hierarchical file tree for the current user"""
    try:
        tree = await fs.get_file_tree(current_user.username)
        return tree
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error building file tree: {str(e)}"
        )


@router.put('/files/{file_id}/move', status_code=status.HTTP_200_OK)
@PermissionRequired(permission="edit")
async def move_file(
    file_id: str,
    new_parent_id: str,
    current_user: UserSecure = Depends(get_current_user)
):
    """Move a file to a new parent folder"""
    try:
        success = await fs.move_file(file_id, new_parent_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to move file"
            )

        return {"message": "File moved successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error moving file: {str(e)}"
        )
