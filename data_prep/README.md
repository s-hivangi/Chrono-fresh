# Chronofresh Data Preparation & Dataset Augmentation

This directory contains dataset engineering tools and scripts designed to preprocess, normalize, and augment raw produce image datasets prior to model training and inference backbone optimization.

---

## Overview

The primary dataset pipeline script is `augment_and_rename_produce.py`. It automates the following tasks:

1. **Standardized Naming Convention**: Renames raw input images to a consistent format (`<produce>_<stage>_<index>.jpg`) for automated parsing during batch ingestion.
2. **Data Augmentation**: Applies computer vision geometric and color transformations to enhance model generalization:
   - Random rotations (`±15°`)
   - Horizontal and vertical flips
   - Brightness, contrast, and hue adjustments (simulating varying storage lighting conditions)
3. **Thumbnail & Dimension Rescaling**: Resizes images to standard CNN / Vision Transformer input resolutions (`224x224` or `512x512`).

---

## Usage Instructions

### Running Dataset Pipeline

```bash
# Navigate to data_prep directory
cd data_prep

# Execute augmentation and renaming script
python augment_and_rename_produce.py --input_dir /path/to/raw_images --output_dir /path/to/processed_dataset
```

---

## Script Specifications

| File | Purpose |
| :--- | :--- |
| `augment_and_rename_produce.py` | Main Python pipeline for batch augmentation, renaming, and directory formatting |
