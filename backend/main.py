import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from contextlib import asynccontextmanager

from app.routers import auth_router, filesystem_router
from app.services.firebase_service import FirebaseService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting Sensei ...")

    # Initialize Firebase
    try:
        firebase_service = FirebaseService()
        print("Firebase initialized successfully")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        raise

    yield

    
    print("Shutting down Sensei ...")
    print("Shutdown complete")



app = FastAPI(
    title="Sensei ",
    description="""
    A comprehensive code sharing platform .
    
    Features
    
    User Authentication - Register, login, and manage user accounts
    Virtual File System - Create, edit, and organize files in a virtual filesystem
    File Sharing- Share files with specific users or make them public
    Permission Management - Control who can view and edit your files
    Search- Find files by name or content across owned, shared, and public files
    File Tree - Hierarchical view of your filesystem
    
    Authentication
    
    Use the `/auth/login` endpoint to get a JWT token, then include it in the Authorization header:
    
    Authorization: Bearer <your-jwt-token>
    
    """,
    version="1.0.0",
    contact={
        "name": "Sensei Development Team",
        "email": "lordfirebcorps@gmail.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "The requested resource was not found",
            "status_code": 404,
            "path": str(request.url.path)
        }
    )


@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please try again later.",
            "status_code": 500,
            "path": str(request.url.path)
        }
    )


# Include routers
app.include_router(auth_router.router)
app.include_router(filesystem_router.router)


# Root endpoints
@app.get("/", tags=["Root"])
async def root():
    """Welcome endpoint with API information"""
    return {
        "message": "Welcome to Sensei Code Sharing Platform!",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "authentication": "/api/v1/auth",
            "filesystem": "/api/v1/filesystem"
        },
        "features": [
            "User Authentication & Authorization",
            "Virtual File System",
            "File Sharing & Permissions",
            "Search Functionality",
            "Public File Access",
            "Hierarchical File Tree"
        ]
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test Firebase connection
        firebase_service = FirebaseService()
        if firebase_service.db:
            db_status = "connected"
        else:
            db_status = "disconnected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": db_status,
            "api": "running"
        }
    }


@app.get("/api/v1", tags=["API Info"])
async def api_info():
    """API version information"""
    return {
        "version": "1.0.0",
        "endpoints": {
            "auth": {
                "register": "POST /api/v1/auth/register",
                "login": "POST /api/v1/auth/login",
                "me": "GET /api/v1/auth/me",
                "update": "PUT /api/v1/auth/me"
            },
            "filesystem": {
                "create_file": "POST /api/v1/filesystem/files/create",
                "get_file": "GET /api/v1/filesystem/files/{file_id}",
                "update_file": "PUT /api/v1/filesystem/files/{file_id}",
                "delete_file": "DELETE /api/v1/filesystem/files/{file_id}",
                "user_files": "GET /api/v1/filesystem/user/files/",
                "search": "GET /api/v1/filesystem/search",
                "share": "POST /api/v1/filesystem/files/{file_id}/share",
                "public_files": "GET /api/v1/filesystem/files/public"
            }
        }
    }


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    log_level = os.getenv("LOG_LEVEL", "info")

    print(f"Starting Sensei on {host}:{port}")
    print(f"API Documentation: http://{host}:{port}/docs")
    print(f"ReDoc Documentation: http://{host}:{port}/redoc")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
        access_log=True
    )
