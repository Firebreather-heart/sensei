from firebase_admin import firestore_async as firestore
from .firebase_service import FirebaseService
from ..models.models import VirtualFile


class FileSystem:
    """Virtual Filesystem for each user, for each user the root is located at {username}/
    Each created file is actually a json document with markers that allow the filesystem to
    construct a virtual filesystem tree.
    Specifications:
    - Each file is a json document with the folowing structure:
        {
            "root": username // This presupposes that the username is unique
            "directory": Boolean // True if this is a directory, False if this is a file
            "id": unique_id // Unique identifier for the file
            "parent": parent_id // The id must be for an object with directory == True
            "name": name // The name of the file or directory
            "content":  content // The content of the file, empty if this is a directory
            "children": [list of child ids] // Empty if this is a file, [Files | Directories]
            "can_view": [list of user ids] // List of user IDs who can view this file
            "can_edit": [list of user ids] // List of user IDs who can edit this file
            "created_at": timestamp // Timestamp of creation
            "updated_at": timestamp // Timestamp of last update
        }
    """

    def __init__(self, ) -> None:
        db = FirebaseService().db
        if db is None:
            raise RuntimeError(
                "FirebaseService is not properly initialized: 'db' is None.")
        else:
            self.db = db

    async def create_file(self, file: VirtualFile) -> VirtualFile:
        """Create a virtual file"""
        # validate file
        if file.directory and file.content is not None:
            raise ValueError("Directory cannot have content")

        file_dict = file.model_dump(exclude={"created_at", "updated_at"})
        file_dict['can_view'].append(file.root)
        file_dict['can_edit'].append(file.root)
        file_dict['created_at'] = firestore.SERVER_TIMESTAMP  # type: ignore
        file_dict['updated_at'] = firestore.SERVER_TIMESTAMP  # type: ignore

        doc_ref = self.db.collection('files').document(file.id)
        await doc_ref.set(file_dict)

        created_doc = await doc_ref.get()

        if not created_doc.exists:
            raise Exception("Failed to create file in the database")
        final_data = created_doc.to_dict()
        if final_data:
            final_data['id'] = created_doc.id
        return VirtualFile.model_validate(final_data)

    async def get_file(self, file_id: str) -> VirtualFile | None:
        """Get a virtual file by id"""
        doc_ref = self.db.collection('files').document(file_id)
        doc = await doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data:
                data['id'] = doc.id
                return VirtualFile.model_validate(data)
        return None

    async def update_file(self, file_id: str, content: str) -> None:
        doc_ref = self.db.collection('files').document(file_id)
        await doc_ref.update({
            'content': content,
            'updated_at': firestore.SERVER_TIMESTAMP  # type: ignore
        })

    async def delete_file(self, file_id: str) -> None:
        doc_ref = self.db.collection('files').document(file_id)
        await doc_ref.delete()

    async def get_user_files(self, username: str):
        query = self.db.collection('files').where('root', '==', username)
        docs = query.stream()

        files = []
        async for doc in docs:
            if doc.exists:
                data = doc.to_dict()
                if data:
                    data['id'] = doc.id
                    files.append(VirtualFile.model_validate(data))
        return files

    async def share_files_with_user(self, file_id: str, username: str, permissions: list[str]) -> None:
        """Share a file with a user"""
        doc_ref = self.db.collection('files').document(file_id)

    async def search_files(self, query: str, username: str, include_shared: bool = True, include_public: bool = True) -> list[VirtualFile]:
        """Search files by name or content"""
        files = []

        # Search in user's own files
        user_query = self.db.collection('files').where('root', '==', username)
        async for doc in user_query.stream():
            if doc.exists:
                data = doc.to_dict()
                if data and self._matches_search(data, query):
                    data['id'] = doc.id
                    files.append(VirtualFile.model_validate(data))

        # Search in shared files
        if include_shared:
            shared_query = self.db.collection('files').where(
                'can_view', 'array_contains', username)
            async for doc in shared_query.stream():
                if doc.exists:
                    data = doc.to_dict()
                    if data and self._matches_search(data, query):
                        data['id'] = doc.id
                        file = VirtualFile.model_validate(data)
                        if file not in files:  # Avoid duplicates
                            files.append(file)

        # Search in public files
        if include_public:
            public_query = self.db.collection(
                'files').where('public', '==', True)
            async for doc in public_query.stream():
                if doc.exists:
                    data = doc.to_dict()
                    if data and self._matches_search(data, query):
                        data['id'] = doc.id
                        file = VirtualFile.model_validate(data)
                        if file not in files:  # Avoid duplicates
                            files.append(file)

        return files

    def _matches_search(self, file_data: dict, query: str) -> bool:
        """Check if file matches search query"""
        query_lower = query.lower()

        # Search in file name
        if query_lower in file_data.get('name', '').lower():
            return True

        # Search in file content
        if query_lower in file_data.get('content', '').lower():
            return True

        return False

    async def get_shared_files(self, username: str) -> list[VirtualFile]:
        """Get files shared with a specific user"""
        files = []

        # Files where user is in can_view list
        query = self.db.collection('files').where(
            'can_view', 'array_contains', username)
        async for doc in query.stream():
            if doc.exists:
                data = doc.to_dict()
                if data and data.get('root') != username:  # Exclude own files
                    data['id'] = doc.id
                    files.append(VirtualFile.model_validate(data))

        return files

    async def get_public_files(self, limit: int = 50) -> list[VirtualFile]:
        """Get public files"""
        files = []

        query = self.db.collection('files').where(
            'public', '==', True).limit(limit)
        async for doc in query.stream():
            if doc.exists:
                data = doc.to_dict()
                if data:
                    data['id'] = doc.id
                    files.append(VirtualFile.model_validate(data))

        return files

    async def get_file_tree(self, username: str) -> dict:
        """Get hierarchical file tree for a user"""
        files = await self.get_user_files(username)

        # Build tree structure
        file_dict = {f.id: f for f in files}
        tree = []

        # Find root files (no parent)
        for file in files:
            if file.parent is None:
                tree.append(self._build_tree_node(file, file_dict))

        return {
            "username": username,
            "tree": tree
        }

    def _build_tree_node(self, file: VirtualFile, file_dict: dict) -> dict:
        """Build a tree node with children"""
        node = {
            "id": file.id,
            "name": file.name,
            "directory": file.directory,
            "public": file.public,
            "children": []
        }

        if file.directory:
            for child_id in file.children:  # type:ignore
                if child_id in file_dict:
                    child_node = self._build_tree_node(
                        file_dict[child_id], file_dict)
                    node["children"].append(child_node)

        return node

    async def share_file_with_user(self, owner_id: str, file_id: str, target_username: str, permissions: list[str]) -> bool:
        """
        Share a file with another user with specific permissions.

        Args:
            owner_id: ID of the file owner
            file_id: ID of the file to share
            target_username: Username of the user to share with
            permissions: List of permissions to grant ['view', 'edit']

        Returns:
            bool: True if sharing was successful, False otherwise
        """
        try:
            # First, verify the target user exists
            from .auth_service import AuthService
            auth_service = AuthService()
            target_user = await auth_service.get_user_by_username(target_username)

            if not target_user:
                print(f"Target user '{target_username}' not found")
                return False

            # Get the file to verify it exists and check ownership
            from .filesystem import FileSystem
            fs = FileSystem()
            file = await fs.get_file(file_id)

            if not file:
                print(f"File '{file_id}' not found")
                return False

            # Check if the requesting user is the owner
            if file.root != owner_id:
                print(
                    f"User '{owner_id}' is not the owner of file '{file_id}'")
                return False

            # Prepare updates for Firestore
            doc_ref = self.db.collection('files').document(file_id)
            updates = {'updated_at': SERVER_TIMESTAMP} # type: ignore

            # Handle view permission
            if 'view' in permissions:
                # Use your existing method to add to view list
                await self.add_user_to_view_list(target_username, file)

            # Handle edit permission
            if 'edit' in permissions:
                # Use your existing method to add to edit list
                await self.add_user_to_edit_list(target_username, file)

                # If user can edit, they should also be able to view
                # (in case 'view' wasn't explicitly included)
                await self.add_user_to_view_list(target_username, file)

            return True

        except Exception as e:
            print(f"Error sharing file: {e}")
            return False

    async def revoke_user_access(self, owner_id: str, file_id: str, target_username: str) -> bool:
        """
        Revoke a user's access to a file.

        Args:
            owner_id: ID of the file owner
            file_id: ID of the file
            target_username: Username of the user to revoke access from

        Returns:
            bool: True if revocation was successful, False otherwise
        """
        try:
            # Get the file to verify ownership
            from .filesystem import FileSystem
            fs = FileSystem()
            file = await fs.get_file(file_id)

            if not file:
                return False

            # Check if the requesting user is the owner
            if file.root != owner_id:
                return False

            # Remove user from both view and edit lists
            await self.remove_user_from_view_list(target_username, file)
            await self.remove_user_from_edit_list(target_username, file)

            return True

        except Exception as e:
            print(f"Error revoking access: {e}")
            return False

    async def make_file_public(self, owner_id: str, file_id: str) -> bool:
        """
        Make a file publicly accessible.

        Args:
            owner_id: ID of the file owner
            file_id: ID of the file to make public

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get the file to verify ownership
            from .filesystem import FileSystem
            fs = FileSystem()
            file = await fs.get_file(file_id)

            if not file:
                return False

            # Check if the requesting user is the owner
            if file.root != owner_id:
                return False

            # Update the file to be public
            doc_ref = self.db.collection('files').document(file_id)
            await doc_ref.update({
                'public': True,
                'updated_at': SERVER_TIMESTAMP # type: ignore
            })

            return True

        except Exception as e:
            print(f"Error making file public: {e}")
            return False

    async def make_file_private(self, owner_id: str, file_id: str) -> bool:
        """
        Make a file private (not publicly accessible).

        Args:
            owner_id: ID of the file owner
            file_id: ID of the file to make private

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get the file to verify ownership
            from .filesystem import FileSystem
            fs = FileSystem()
            file = await fs.get_file(file_id)

            if not file:
                return False

            # Check if the requesting user is the owner
            if file.root != owner_id:
                return False

            # Update the file to be private
            doc_ref = self.db.collection('files').document(file_id)
            await doc_ref.update({
                'public': False,
                'updated_at': SERVER_TIMESTAMP # type: ignore
            })

            return True

        except Exception as e:
            print(f"Error making file private: {e}")
            return False

    async def remove_user_from_view_list(self, username: str, file: VirtualFile) -> None:
        """
        Remove a user from the view list of a file.
        """
        can_view = await self._get_user_view_list(file)
        if username in can_view:
            can_view.remove(username)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_view': can_view})

    async def remove_user_from_edit_list(self, username: str, file: VirtualFile) -> None:
        """
        Remove a user from the edit list of a file.
        """
        can_edit = await self._get_user_edit_list(file)
        if username in can_edit:
            can_edit.remove(username)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_edit': can_edit})

    async def _get_user_view_list(self, file: VirtualFile) -> list[str]:
        """
        Get the list of users who can view a file.
        """
        if file.can_view:
            return file.can_view
        return []
    
    async def _get_user_edit_list(self, file: VirtualFile) -> list[str]:
        """
        Get the list of users who can edit a file.
        """
        if file.can_edit:
            return file.can_edit
        return []
    
    async def add_user_to_view_list(self, username: str, file: VirtualFile) -> None:
        """
        Add a user to the view list of a file.
        """
        can_view = await self._get_user_view_list(file)
        if username not in can_view:
            can_view.append(username)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_view': can_view})

    async def add_user_to_edit_list(self, username: str, file: VirtualFile) -> None:
        """
        Add a user to the edit list of a file.
        """
        can_edit = await self._get_user_edit_list(file)
        if username not in can_edit:
            can_edit.append(username)
            doc_ref = self.db.collection('files').document(file.id)
            await doc_ref.update({'can_edit': can_edit})