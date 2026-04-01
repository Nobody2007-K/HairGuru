#!/usr/bin/env python3
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", "4000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
