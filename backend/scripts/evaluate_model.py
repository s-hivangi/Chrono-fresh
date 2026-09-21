"""Inspect or evaluate the supplied ChronoFresh Keras model without retraining it."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any

import keras
import numpy as np
from PIL import Image


BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = BACKEND_DIR / "models" / "efficientnetb3_final.keras"
DEFAULT_METADATA = BACKEND_DIR / "models" / "model_metadata.json"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}


def preprocess(path: Path) -> np.ndarray:
    """Match runtime preprocessing: RGB/bilinear/300 square, no external scaling."""
    with Image.open(path) as source:
        image = source.convert("RGB").resize((300, 300), Image.Resampling.BILINEAR)
    return np.expand_dims(np.asarray(image, dtype=np.float32), 0)


def output_dict(model: Any, outputs: Any) -> dict[str, Any]:
    if isinstance(outputs, dict):
        return outputs
    return dict(zip(model.output_names, outputs))


def inspect(model: Any, model_path: Path, metadata: dict[str, Any]) -> None:
    print(json.dumps({
        "model_path": str(model_path.resolve()),
        "sha256": hashlib.sha256(model_path.read_bytes()).hexdigest(),
        "keras_version": keras.__version__,
        "model_name": model.name,
        "input_shape": model.input_shape,
        "input_dtype": str(model.input_dtype),
        "output_names": model.output_names,
        "output_shape": model.output_shape,
        "class_names": metadata["class_names"],
        "class_mapping_verified": metadata["class_mapping_verified"],
        "parameters": model.count_params(),
    }, indent=2, default=str))
    model.summary()


def evaluate(model: Any, dataset: Path, metadata: dict[str, Any]) -> list[dict[str, Any]]:
    classes = metadata["class_names"]
    by_folder = {name.casefold(): name for name in classes}
    rows: list[dict[str, Any]] = []
    for path in sorted(p for p in dataset.rglob("*") if p.suffix.lower() in IMAGE_SUFFIXES):
        actual = by_folder.get(path.parent.name.casefold())
        if actual is None:
            print(f"Skipping {path}: parent folder is not a configured class")
            continue
        values = output_dict(model, model.predict(preprocess(path), verbose=0))
        probabilities = values["freshness_prediction"][0]
        index = int(np.argmax(probabilities))
        predicted = classes[index]
        rows.append({
            "path": str(path), "actual": actual, "predicted": predicted,
            "predicted_index": index, "raw_model_confidence": float(probabilities[index]),
            "days_to_spoilage": max(0.0, float(values["days_to_spoilage"][0][0])),
            "correct": predicted == actual,
        })
    return rows


def report(rows: list[dict[str, Any]], classes: list[str]) -> dict[str, Any]:
    matrix = {actual: {predicted: 0 for predicted in classes} for actual in classes}
    for row in rows:
        matrix[row["actual"]][row["predicted"]] += 1
    result = {
        "total_images": len(rows),
        "correct_predictions": sum(row["correct"] for row in rows),
        "accuracy": (sum(row["correct"] for row in rows) / len(rows)) if rows else None,
        "actual_counts": dict(Counter(row["actual"] for row in rows)),
        "predicted_counts": dict(Counter(row["predicted"] for row in rows)),
        "confusion_matrix": matrix,
        "incorrect_examples": [row for row in rows if not row["correct"]],
    }
    print(json.dumps(result, indent=2))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--metadata", type=Path, default=DEFAULT_METADATA)
    parser.add_argument("--dataset", type=Path, help="Directory whose immediate image parent folders are class names")
    parser.add_argument("--csv", type=Path)
    parser.add_argument("--json", type=Path)
    args = parser.parse_args()

    metadata = json.loads(args.metadata.read_text(encoding="utf-8"))
    model = keras.saving.load_model(args.model, compile=False)
    inspect(model, args.model, metadata)
    if not args.dataset:
        return
    rows = evaluate(model, args.dataset, metadata)
    summary = report(rows, metadata["class_names"])
    if args.csv:
        args.csv.parent.mkdir(parents=True, exist_ok=True)
        with args.csv.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]) if rows else ["path"])
            writer.writeheader()
            writer.writerows(rows)
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps({"summary": summary, "predictions": rows}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
