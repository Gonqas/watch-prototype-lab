from __future__ import annotations

from collections.abc import Iterable
from typing import Any


def nested(data: dict[str, Any], path: str, default: Any = None) -> Any:
    current: Any = data
    for key in path.split("."):
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def dimension(data: dict[str, Any], path: str, default: float = 0.0) -> float:
    value = nested(data, path, default)
    if isinstance(value, dict):
        value = value.get("value", default)
    if value is None:
        return float(default)
    return float(value)


def string_value(data: dict[str, Any], path: str, default: str = "") -> str:
    value = nested(data, path, default)
    return str(value) if value is not None else default


def bool_value(data: dict[str, Any], path: str, default: bool = False) -> bool:
    value = nested(data, path, default)
    return bool(value)


def list_value(data: dict[str, Any], path: str) -> list[dict[str, Any]]:
    value = nested(data, path, [])
    if not isinstance(value, Iterable) or isinstance(value, (str, bytes, dict)):
        return []
    return [item for item in value if isinstance(item, dict)]
