"""
Script to update Google Drive / Colab paths in faceshape_detection.ipynb
to local paths that work on the user's machine.
"""
import json

NOTEBOOK = "faceshape_detection.ipynb"

with open(NOTEBOOK, "r", encoding="utf-8") as f:
    nb = json.load(f)

changes = 0

for cell in nb["cells"]:
    if cell["cell_type"] != "code":
        continue

    new_source = []
    modified = False
    for line in cell["source"]:
        original = line

        # ── 1. Remove Google Colab drive mount lines entirely ──
        if "from google.colab import drive" in line:
            line = "# (Colab-only) " + line
            modified = True
        if "drive.flush_and_unmount()" in line:
            line = "# (Colab-only) " + line
            modified = True
        if "drive.mount(" in line:
            line = "# (Colab-only) " + line
            modified = True
        if "!rm -rf /content/drive" in line:
            line = "# (Colab-only) " + line
            modified = True
        if "!mkdir -p /content/drive" in line:
            line = "# (Colab-only) " + line
            modified = True

        # ── 2. Replace /content/drive/MyDrive/face_shape_project with local testing path ──
        if "/content/drive/MyDrive/face_shape_project" in line:
            line = line.replace(
                "/content/drive/MyDrive/face_shape_project",
                "../archive/FaceShape Dataset/testing_set/Square"
            )
            modified = True

        # ── 3. Replace all remaining /content/drive/MyDrive/ with local models dir ──
        if "/content/drive/MyDrive/" in line:
            line = line.replace("/content/drive/MyDrive/", "")
            modified = True

        new_source.append(line)

    if modified:
        cell["source"] = new_source
        changes += 1

with open(NOTEBOOK, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=2, ensure_ascii=False)

print(f"[OK] Done! Modified {changes} cell(s) in {NOTEBOOK}")
print("All Google Drive paths have been converted to local paths.")
