class IdeaCreate(BaseModel):
    name: str
    content: str

class IdeaUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    customers: Optional[str] = None
    competitors: Optional[str] = None
