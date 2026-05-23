#!/usr/bin/env python3
"""Download the InsightFace face-swap model (inswapper_128.onnx) for virtual try-on.

The model (~246MB) is not bundled with insightface. This fetches it once into
backend/models/inswapper_128.onnx. Run during setup:

    cd backend && ./venv/bin/python scripts/download_tryon_model.py
"""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import INSWAPPER_MODEL  # noqa: E402

# Public HuggingFace mirrors that host inswapper_128.onnx. Tried in order.
MIRRORS = [
    "https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx",
    "https://huggingface.co/datasets/Gourieff/ReActor/resolve/main/models/inswapper_128.onnx",
    "https://huggingface.co/thebiglaskowski/inswapper_128.onnx/resolve/main/inswapper_128.onnx",
    "https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx",
]

MIN_BYTES = 100 * 1024 * 1024  # sanity check: real model is ~246MB


def _download(url: str, dest: Path) -> bool:
    try:
        print(f"  trying {url}", flush=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status != 200:
                print(f"    HTTP {resp.status}")
                return False
            tmp = dest.with_suffix(".part")
            total = 0
            with open(tmp, "wb") as f:
                while True:
                    chunk = resp.read(1 << 20)
                    if not chunk:
                        break
                    f.write(chunk)
                    total += len(chunk)
                    print(f"\r    {total / 1e6:.1f} MB", end="", flush=True)
            print()
            if total < MIN_BYTES:
                print(f"    too small ({total} bytes) — not the model")
                tmp.unlink(missing_ok=True)
                return False
            tmp.rename(dest)
            return True
    except Exception as e:  # noqa: BLE001
        print(f"    failed: {e}")
        return False


def main() -> int:
    dest = Path(INSWAPPER_MODEL)
    if dest.exists() and dest.stat().st_size >= MIN_BYTES:
        print(f"Already present: {dest} ({dest.stat().st_size / 1e6:.1f} MB)")
        return 0

    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading inswapper_128.onnx -> {dest}")
    for url in MIRRORS:
        if _download(url, dest):
            print(f"Saved {dest} ({dest.stat().st_size / 1e6:.1f} MB)")
            return 0

    print(
        "\nAll mirrors failed. Manually place inswapper_128.onnx at:\n"
        f"  {dest}\n"
        "Search HuggingFace for 'inswapper_128.onnx'."
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
