from __future__ import annotations

import io
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError


SUPPORTED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}
MIN_IMAGE_DIMENSION = 96


def register_heif_opener() -> None:
    try:
        from pillow_heif import register_heif_opener as register
    except ImportError:
        return
    register()


async def read_validated_image(upload: UploadFile, max_size_mb: int) -> bytes:
    """Read, validate and normalize an upload to bounded JPEG bytes."""
    if upload.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {upload.content_type}")

    raw = await upload.read()
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(raw) > max_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {max_size_mb} MB.")

    register_heif_opener()
    try:
        with Image.open(io.BytesIO(raw)) as source:
            source.verify()
        with Image.open(io.BytesIO(raw)) as source:
            if min(source.size) < MIN_IMAGE_DIMENSION:
                raise HTTPException(
                    status_code=422,
                    detail=f"Image is too small. Both dimensions must be at least {MIN_IMAGE_DIMENSION} pixels.",
                )
            normalized = ImageOps.exif_transpose(source).convert("RGB")
            normalized.thumbnail((1080, 1080))
            output = io.BytesIO()
            normalized.save(output, "JPEG", quality=88, optimize=True)
            return output.getvalue()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid decodable image.") from exc


def save_normalized_image(normalized_bytes: bytes, upload_dir: Path) -> tuple[Path, Path]:
    upload_dir.mkdir(parents=True, exist_ok=True)
    image_path = upload_dir / f"{uuid4().hex}.jpg"
    thumbnail_path = upload_dir / f"{image_path.stem}_thumb.jpg"
    try:
        image_path.write_bytes(normalized_bytes)
        with Image.open(io.BytesIO(normalized_bytes)) as image:
            thumb = image.copy()
            thumb.thumbnail((360, 360))
            thumb.save(thumbnail_path, "JPEG", quality=82, optimize=True)
    except Exception:
        image_path.unlink(missing_ok=True)
        thumbnail_path.unlink(missing_ok=True)
        raise
    return image_path, thumbnail_path


async def save_upload_image(
    upload: UploadFile,
    upload_dir: Path,
    max_size_mb: int = 10,
) -> tuple[Path, Path]:
    normalized = await read_validated_image(upload, max_size_mb)
    return save_normalized_image(normalized, upload_dir)
