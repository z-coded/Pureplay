"""
PurePlay — Synthetic / Sample Dataset Generator for NudeNet Training Verification
Creates sample categorized image directories with synthetic test images
so the training script can be executed immediately for demo & verification.
"""

import os
import numpy as np
from PIL import Image

TARGET_CLASSES = [
    "SAFE",
    "FEMALE_GENITALIA_EXPOSED",
    "FEMALE_BREAST_EXPOSED",
    "BUTTOCKS_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
]

def generate_synthetic_data(output_dir="./data", samples_per_class=12):
    print(f"[*] Generating synthetic test dataset in '{output_dir}'...")
    
    for split in ["train", "val"]:
        n_samples = samples_per_class if split == "train" else max(3, samples_per_class // 3)
        for cls in TARGET_CLASSES:
            cls_folder = os.path.join(output_dir, split, cls)
            os.makedirs(cls_folder, exist_ok=True)

            for i in range(n_samples):
                # Generate RGB image with class-distinct color profile
                np.random.seed(hash(cls + str(i)) % (2**31))
                base_color = np.random.randint(50, 220, size=(3,))
                img_data = np.ones((224, 224, 3), dtype=np.uint8) * base_color
                noise = np.random.randint(-25, 25, size=(224, 224, 3))
                img_data = np.clip(img_data + noise, 0, 255).astype(np.uint8)

                img = Image.fromarray(img_data)
                img.save(os.path.join(cls_folder, f"sample_{i:03d}.jpg"))

    print(f"[+] Synthetic dataset generated successfully in '{output_dir}'.")

if __name__ == "__main__":
    generate_synthetic_data()
