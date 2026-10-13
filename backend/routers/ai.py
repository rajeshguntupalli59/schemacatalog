from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import ai_describer as ai

router = APIRouter(prefix="/ai", tags=["ai"])


class ConfigBody(BaseModel):
    endpoint: str = ""
    api_key: str = ""
    model: str = ""
    provider: str = "openai"


class DescribeBody(BaseModel):
    schema: str
    name: str
    columns: list = []
    foreign_keys: list = []


@router.get("/config")
def get_config():
    cfg = ai.get_ai_config()
    cfg.pop("api_key", None)  # never expose the key
    return cfg


@router.put("/config")
def save_config(body: ConfigBody):
    ai.save_ai_config(body.endpoint, body.api_key, body.model, body.provider)
    return {"ok": True}


@router.post("/describe")
def describe(body: DescribeBody):
    try:
        return ai.describe_table(body.schema, body.name, body.columns, body.foreign_keys)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"AI request failed: {str(e)[:300]}")
