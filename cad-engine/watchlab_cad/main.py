from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from .protocol import handle_request


def _response(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        return handle_request(payload)
    except (ValidationError, ValueError, RuntimeError, TypeError) as error:
        return {
            "ok": False,
            "error": str(error),
            "errorType": type(error).__name__,
        }


def _run_stdio() -> int:
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
            result = _response(payload)
        except json.JSONDecodeError as error:
            result = {"ok": False, "error": str(error), "errorType": "JSONDecodeError"}
        print(json.dumps(result, ensure_ascii=True), flush=True)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Watch Prototype Lab local CAD engine")
    parser.add_argument("--request", type=Path)
    parser.add_argument("--response", type=Path)
    parser.add_argument("--stdio", action="store_true")
    args = parser.parse_args()
    if args.stdio or args.request is None:
        return _run_stdio()
    payload = json.loads(args.request.read_text(encoding="utf-8"))
    result = _response(payload)
    encoded = json.dumps(result, indent=2, ensure_ascii=True)
    if args.response:
        args.response.parent.mkdir(parents=True, exist_ok=True)
        args.response.write_text(encoded, encoding="utf-8")
    else:
        print(encoded)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
