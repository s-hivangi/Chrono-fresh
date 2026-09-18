"""
Augment public produce images and rename them into the Chronofresh dataset format.

Important labeling note:
The Day labels assigned to augmented images (D1, D2, D3, ...) are NOT real
time-tracked spoilage progression labels. They are only used to satisfy the
required filename format for dataset organization. Public augmented datasets
prepared with this script should be used for freshness-stage classification,
not shelf-life regression. Valid regression labels require self-collected,
daily-tracked images.
"""

from pathlib import Path

import albumentations as A  # pyright: ignore[reportMissingImports]
import cv2  # pyright: ignore[reportMissingImports]


# Batch configuration.
PRODUCE_TYPE = "Banana"
INPUT_DIR = "data_prep/raw_public/banana"
OUTPUT_DIR = "data_prep/processed_public/banana"
AUGS_PER_IMAGE = 4
TIME_OF_DAY = "M"  # "M" for Morning, "N" for Night.
ANGLE = "Side"  # One of: "Side", "Top", "Front".


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
JPEG_QUALITY = 95


def build_augmentation_pipeline(height: int, width: int) -> A.Compose:
    """Create a produce-appropriate augmentation pipeline for one image size."""
    crop_height = max(1, int(height * 0.9))
    crop_width = max(1, int(width * 0.9))

    return A.Compose(
        [
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.15),
            A.Rotate(
                limit=30,
                border_mode=cv2.BORDER_REFLECT_101,
                p=0.75,
            ),
            A.RandomBrightnessContrast(
                brightness_limit=0.18,
                contrast_limit=0.18,
                p=0.7,
            ),
            A.RandomCrop(
                height=crop_height,
                width=crop_width,
                p=0.6,
            ),
            A.Resize(height=height, width=width, p=1.0),
            A.GaussNoise(
                var_limit=(5.0, 25.0),
                mean=0,
                p=0.25,
            ),
        ]
    )


def is_supported_image(path: Path) -> bool:
    """Return True when the path has an image extension supported by this script."""
    return path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS


def make_output_name(
    produce_type: str,
    sample_number: int,
    day_number: int,
    time_of_day: str,
    angle: str,
) -> str:
    """Build a filename using the required project convention."""
    sample_id = f"T{sample_number:04d}"
    day = f"D{day_number}"
    return f"{produce_type}_{sample_id}_{day}_{time_of_day}_{angle}.jpeg"


def save_jpeg(path: Path, image_bgr) -> bool:
    """Save an image as JPEG and return whether OpenCV reported success."""
    return cv2.imwrite(str(path), image_bgr, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])


def main() -> None:
    input_dir = Path(INPUT_DIR)
    output_dir = Path(OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")

    source_images = sorted(path for path in input_dir.iterdir() if is_supported_image(path))

    processed_originals = 0
    saved_total = 0

    for sample_number, source_path in enumerate(source_images, start=1):
        image_bgr = cv2.imread(str(source_path), cv2.IMREAD_COLOR)

        if image_bgr is None:
            print(f"Warning: Skipping unreadable or corrupted image: {source_path}")
            continue

        height, width = image_bgr.shape[:2]
        if height == 0 or width == 0:
            print(f"Warning: Skipping image with invalid dimensions: {source_path}")
            continue

        original_name = make_output_name(
            PRODUCE_TYPE,
            sample_number,
            day_number=0,
            time_of_day=TIME_OF_DAY,
            angle=ANGLE,
        )
        original_output_path = output_dir / original_name

        if not save_jpeg(original_output_path, image_bgr):
            print(f"Warning: Failed to save original image: {original_output_path}")
            continue

        processed_originals += 1
        saved_total += 1

        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        augment = build_augmentation_pipeline(height=height, width=width)

        for aug_index in range(1, AUGS_PER_IMAGE + 1):
            try:
                augmented_rgb = augment(image=image_rgb)["image"]
                augmented_bgr = cv2.cvtColor(augmented_rgb, cv2.COLOR_RGB2BGR)
            except Exception as exc:
                print(
                    "Warning: Failed to augment "
                    f"{source_path} for D{aug_index}: {type(exc).__name__}: {exc}"
                )
                continue

            augmented_name = make_output_name(
                PRODUCE_TYPE,
                sample_number,
                day_number=aug_index,
                time_of_day=TIME_OF_DAY,
                angle=ANGLE,
            )
            augmented_output_path = output_dir / augmented_name

            if save_jpeg(augmented_output_path, augmented_bgr):
                saved_total += 1
            else:
                print(f"Warning: Failed to save augmented image: {augmented_output_path}")

    print("Processing complete.")
    print(f"Original images processed: {processed_originals}")
    print(f"Total images saved: {saved_total}")


if __name__ == "__main__":
    main()
