import argparse
import json

from .face_shape import analyze_face_shape_json


def main() -> None:
    parser = argparse.ArgumentParser(description="HairGuru AI Engine CLI")
    parser.add_argument("image_path", help="Path to the image file to analyze")
    parser.add_argument("--hair-type", help="Optional hair type filter")
    args = parser.parse_args()

    result = analyze_face_shape_json(args.image_path, hair_type=args.hair_type)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
