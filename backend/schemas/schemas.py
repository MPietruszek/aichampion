from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from typing import Literal

class ConversationOut(BaseModel):
    id: UUID
    title: str
    file_name: str
    file_type: str
    file_size: int
    indexed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationPatch(BaseModel):
    title: str

class Source(BaseModel):
    paragraph: str
    title: str | None = None
    text: str
    score: float

class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    sources: list[Source] | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str
    command: str | None = None  # np. "dpa-review", "ip-clause-review"

class CommandOut(BaseModel):
    name: str
    label: str
    description: str
    hint: str

class SSEToken(BaseModel):
    type: Literal['token'] = 'token'
    content: str

class SSESources(BaseModel):
    type: Literal['sources'] = 'sources'
    sources: list[Source]

class SSEDone(BaseModel):
    type: Literal['done'] = 'done'

class SSEError(BaseModel):
    type: Literal['error'] = 'error'
    message: str
