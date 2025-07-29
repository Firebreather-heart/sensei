from typing import Annotated
from datetime import datetime
from pydantic import BaseModel

class VirtualFile(BaseModel): 
    """Base model for files in the virtua filesystem"""
    root:Annotated[str, "Username of the owner"] 
    directory: Annotated[bool, "True if this is a directory, False if this is a file"]
    id: Annotated[str, "Unique identifier for the file"]| None = None
    parent: None | Annotated[str, "ID of the parent directory, must be a directory, if None, this is a root file"] = None
    name: Annotated[str, "Name of the file or directory"]
    content: None | Annotated[str, "Content of the file, none if this is a directory"] = None
    children: Annotated[list[str], "List of child IDs, empty if this is a file, list of file or directory IDs, empty if this is a file"] | None =  []
    can_view: list[str] | None = []  # List of user IDs who can view this file
    can_edit: list[str] | None = []  # List of user IDs who can
    public: Annotated[bool, "True if this file is public, False if this file is private"]= False
    created_at: Annotated[datetime, "Timestamp of creation"] | None = None
    updated_at: Annotated[datetime, "Timestamp of last update"] | None  = None

    model_config = {
        "from_attributes": True, 
        "json_encoders": {
            datetime: lambda dt: dt.isoformat()  
        },
        "from_attributes":True #type:ignore
    }
