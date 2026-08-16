from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps


SUPPORTED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}


def register_heif_opener() -> None:
    try:
        from pillow_heif import register_heif_opener as register
    except ImportError:
        return
    register()


async def save_upload_image(upload: UploadFile, upload_dir: Path) -> tuple[Path, Path]:
    if upload.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {upload.content_type}")

    register_heif_opener()
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(upload.filename or "upload").suffix.lower()
    temp_path = upload_dir / f"{uuid4().hex}{suffix or '.img'}"
    raw_bytes = await upload.read()
    temp_path.write_bytes(raw_bytes)

    image_path = upload_dir / f"{uuid4().hex}.jpg"
    thumbnail_path = upload_dir / f"{image_path.stem}_thumb.jpg"

    try:
        with Image.open(temp_path) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((1080, 1080))
            image.save(image_path, "JPEG", quality=88, optimize=True)

            thumb = image.copy()
            thumb.thumbnail((360, 360))
            thumb.save(thumbnail_path, "JPEG", quality=82, optimize=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}") from exc
    finally:
        temp_path.unlink(missing_ok=True)

    return image_path, thumbnail_path
