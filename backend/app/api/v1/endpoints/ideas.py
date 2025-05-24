from fastapi import APIRouter, HTTPException, Depends
from app.auth.main import get_current_user
from app.database import ideas
from app.lib.models import IdeaCreate, IdeaUpdate

router = APIRouter()

@router.get("/{idea_id}")
async def get_idea(idea_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific idea for the authenticated user"""
    print(f"Getting idea: {idea_id} for user: {user_id}")
    try:
        idea = await ideas.get_user_idea(idea_id, user_id)
        return {"idea": idea}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def get_ideas(user_id: str = Depends(get_current_user)):
    """Get all ideas for the authenticated user"""
    print(f"Getting ideas for user: {user_id}")
    try:
        ideas_list = await ideas.get_user_ideas(user_id)
        return {"ideas": ideas_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_idea(idea: IdeaCreate, user_id: str = Depends(get_current_user)):
    """Create a new idea for the authenticated user"""
    try:
        created_idea = await ideas.create_idea(user_id, idea.name, idea.content)
        return created_idea
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{idea_id}")
async def update_idea(idea_id: str, idea: IdeaUpdate, user_id: str = Depends(get_current_user)):
    """Update a idea if it belongs to the authenticated user"""
    print("received update idea request")
    try:
        updates = idea.dict(exclude_unset=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No valid update fields provided")

        updated_idea = await ideas.update_idea(idea_id, user_id, updates)
        return updated_idea
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{idea_id}")
async def delete_idea(idea_id: str, user_id: str = Depends(get_current_user)):
    """Delete a idea if it belongs to the authenticated user"""
    try:
        await ideas.delete_idea(idea_id, user_id)
        return {"status": "success", "message": "Idea deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

