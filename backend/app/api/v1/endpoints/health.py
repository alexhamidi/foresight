from app.lib.constants import FRONTEND_URL
from fastapi import APIRouter

router = APIRouter()

# =======================================================================#
# Debugging and health check
# =======================================================================#
@router.get("")
def health_check():
    return {"status": "healthy", "message": "API is running", "status_code": 200}

