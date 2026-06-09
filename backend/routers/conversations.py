import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.db_models import Conversation, User
from schemas.schemas import ConversationOut, ConversationPatch
from services.document_processor import process_document
from services.embeddings import embed_texts
from services.qdrant_service import create_collection, index_chunks, delete_collection
from services.auth import get_current_user
from config import settings

router = APIRouter(prefix='/api/conversations', tags=['conversations'])

ALLOWED_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}


async def _index_document(conv_id: str, file_path: Path, file_type: str, collection: str):
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            chunks = process_document(file_path, file_type)
            if not chunks:
                raise ValueError('Nie udało się odczytać tekstu z dokumentu')
            vectors = embed_texts([c.text for c in chunks])
            create_collection(collection)
            index_chunks(collection, chunks, vectors)
            conv = await db.get(Conversation, uuid.UUID(conv_id))
            if conv:
                conv.indexed = True
                await db.commit()
        except Exception as e:
            print(f'Błąd indeksowania {conv_id}: {e}')


@router.get('', response_model=list[ConversationOut])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.post('', response_model=ConversationOut, status_code=201)
async def create_conversation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, 'Obsługiwane formaty: PDF, DOCX')

    content = await file.read()
    if len(content) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(400, f'Maksymalny rozmiar: {settings.max_file_size_mb} MB')

    file_type = ALLOWED_TYPES[file.content_type]
    conv_id = uuid.uuid4()
    collection = f'conv_{conv_id.hex}'
    title = Path(file.filename or 'dokument').stem

    save_dir = Path(settings.documents_path) / str(conv_id)
    save_dir.mkdir(parents=True, exist_ok=True)
    file_path = save_dir / f'original.{file_type}'
    file_path.write_bytes(content)

    conv = Conversation(
        id=conv_id,
        user_id=current_user.id,
        title=title,
        file_name=file.filename or f'dokument.{file_type}',
        file_type=file_type,
        file_size=len(content),
        qdrant_collection=collection,
        indexed=False,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    background_tasks.add_task(_index_document, str(conv_id), file_path, file_type, collection)
    return conv


@router.patch('/{conv_id}', response_model=ConversationOut)
async def rename_conversation(
    conv_id: uuid.UUID,
    body: ConversationPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conv_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(404, 'Nie znaleziono rozmowy')
    conv.title = body.title
    await db.commit()
    await db.refresh(conv)
    return conv


@router.delete('/{conv_id}', status_code=204)
async def delete_conversation(
    conv_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conv_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(404, 'Nie znaleziono rozmowy')
    try:
        delete_collection(conv.qdrant_collection)
    except Exception:
        pass
    save_dir = Path(settings.documents_path) / str(conv_id)
    if save_dir.exists():
        shutil.rmtree(save_dir)
    await db.delete(conv)
    await db.commit()
