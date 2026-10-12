from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import snapshots as snap_store

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


class SaveRequest(BaseModel):
    name:     str
    db_type:  str = ""
    database: str = ""
    schema:   dict


class DiffSide(BaseModel):
    snapshot_id: Optional[int] = None
    schema:      Optional[dict] = None


class DiffRequest(BaseModel):
    base:   DiffSide
    target: DiffSide


def _resolve(side: DiffSide) -> dict:
    if side.snapshot_id is not None:
        snap = snap_store.get_snapshot(side.snapshot_id)
        if not snap:
            raise HTTPException(status_code=404,
                                detail=f"Snapshot {side.snapshot_id} not found")
        return snap["schema"]
    if side.schema is not None:
        return side.schema
    raise HTTPException(status_code=400,
                        detail="Each diff side needs snapshot_id or schema")


@router.post("")
def save(req: SaveRequest):
    snap_id = snap_store.save_snapshot(req.name, req.db_type, req.database, req.schema)
    return {"id": snap_id}


@router.get("")
def list_all():
    return snap_store.list_snapshots()


@router.get("/{snap_id}")
def get_one(snap_id: int):
    snap = snap_store.get_snapshot(snap_id)
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return snap


@router.delete("/{snap_id}")
def delete(snap_id: int):
    if not snap_store.delete_snapshot(snap_id):
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return {"deleted": True}


@router.post("/diff")
def diff(req: DiffRequest):
    base = _resolve(req.base)
    target = _resolve(req.target)
    return snap_store.diff_schemas(base, target)
