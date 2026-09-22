from __future__ import annotations

import asyncio
import io

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app import image_utils


def _upload(data: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        file=io.BytesIO(data),
        filename="upload.jpg",
        headers=Headers({"content-type": content_type}),
    )


def test_jpeg_does_not_load_heif(monkeypatch, tiny_jpeg):
    def fail_if_called():
        raise AssertionError("HEIF support should not be loaded for JPEG uploads")

    monkeypatch.setattr(image_utils, "register_heif_opener", fail_if_called)

    normalized = asyncio.run(image_utils.read_validated_image(_upload(tiny_jpeg, "image/jpeg"), 10))

    assert normalized.startswith(b"\xff\xd8")


def test_heif_dependency_failure_returns_415(monkeypatch):
    class BrokenHeif:
        @staticmethod
        def register_heif_opener():
            raise OSError("blocked native DLL")

    monkeypatch.setitem(__import__("sys").modules, "pillow_heif", BrokenHeif)

    with pytest.raises(HTTPException) as error:
        image_utils.register_heif_opener()

    assert error.value.status_code == 415
    assert error.value.detail == image_utils.HEIF_UNSUPPORTED_DETAIL