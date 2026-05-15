from __future__ import annotations

import base64

import httpx
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

from ..config import HAIRFAST_API_URL
from ..schemas import TryOnRequest, TryOnResponse
from ..services import hair_tryon_faceswap as faceswap

router = APIRouter(prefix="/api", tags=["tryon"])


@router.post("/try-on")
async def try_on_hairstyle(body: TryOnRequest):
    raw = body.image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(raw)
    except Exception:
        return TryOnResponse(success=False, error="Invalid image data")

    # Primary path: local InsightFace face-swap (lightweight, CPU, no external API).
    if faceswap.is_available():
        try:
            data_url = await run_in_threadpool(faceswap.try_on, image_bytes, body.hairstyle_name)
            if data_url:
                return TryOnResponse(success=True, response=data_url)
            return TryOnResponse(
                success=False,
                error="Try-on engine unavailable",
                details="Face-swap model failed to load.",
            )
        except faceswap.TryOnError as e:
            return TryOnResponse(success=False, error=str(e))
        except Exception as e:  # noqa: BLE001
            return TryOnResponse(success=False, error="Try-on failed", details=str(e))

    # Fallback: legacy HairFastGAN proxy, only if that server is actually running.
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{HAIRFAST_API_URL}/try-on",
                json={"imageBase64": body.image_base64, "hairstyleName": body.hairstyle_name},
            )
        if response.status_code == 200:
            return TryOnResponse(success=True, response=response.json().get("response"))
        return TryOnResponse(success=False, error="Try-on failed", details=response.text)
    except httpx.ConnectError:
        return TryOnResponse(
            success=False,
            error="Try-on model not installed",
            details="Run: cd backend && ./venv/bin/python scripts/download_tryon_model.py",
        )
    except Exception as e:  # noqa: BLE001
        return TryOnResponse(success=False, error="Try-on failed", details=str(e))
