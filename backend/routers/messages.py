import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.db_models import Conversation, Message
from schemas.schemas import MessageOut, MessageCreate, CommandOut
from services.rag import rag_stream
from services.commands import list_commands, get_command

router = APIRouter(prefix='/api', tags=['messages'])


@router.get('/commands', response_model=list[CommandOut])
def get_commands():
    """Zwraca listę dostępnych slash komend."""
    return list_commands()


@router.get('/conversations/{conv_id}/messages', response_model=list[MessageOut])
async def list_messages(conv_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    conv = await db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(404, 'Nie znaleziono rozmowy')
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at)
    )
    return result.scalars().all()


@router.post('/conversations/{conv_id}/messages')
async def send_message(
    conv_id: uuid.UUID,
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(404, 'Nie znaleziono rozmowy')
    if not conv.indexed:
        raise HTTPException(409, 'Dokument jest jeszcze indeksowany')

    # Walidacja komendy
    if body.command and not get_command(body.command):
        raise HTTPException(400, f'Nieznana komenda: {body.command}')

    # Treść wiadomości użytkownika do wyświetlenia
    display_content = body.content
    if body.command:
        cmd = get_command(body.command)
        display_content = f'/{body.command}' + (f': {body.content}' if body.content else '')

    user_msg = Message(
        conversation_id=conv_id,
        role='user',
        content=display_content,
    )
    db.add(user_msg)
    await db.commit()

    async def event_stream():
        full_answer = ''
        sources_payload = None

        async for event in rag_stream(
            conv.qdrant_collection,
            body.content,
            command=body.command,
        ):
            if event['type'] == 'sources':
                sources_payload = event['sources']
            elif event['type'] == 'done':
                full_answer = event.get('full_answer', full_answer)

            data = json.dumps(event, ensure_ascii=False)
            yield f'data: {data}\n\n'

        assistant_msg = Message(
            conversation_id=conv_id,
            role='assistant',
            content=full_answer,
            sources=sources_payload,
        )
        db.add(assistant_msg)
        await db.commit()

    return StreamingResponse(event_stream(), media_type='text/event-stream')
