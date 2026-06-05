import argparse
from pathlib import Path

from ai_engine.face_shape import analyze_face_shape


def run_tests(image_paths: list[Path], hair_type: str | None = None) -> None:
    if not image_paths:
        raise SystemExit("No images provided for face-shape testing.")

    for image_path in image_paths[:10]:
        print("=" * 60)
        print(f"Testing image: {image_path}")
        try:
            analysis = analyze_face_shape(str(image_path), hair_type=hair_type, debug=True)
            print(f"  Result: face_shape={analysis.face_shape.value}, confidence={analysis.confidence:.3f}")
            print(f"  Recommendations: {[rec.name for rec in analysis.recommendations]}\n")
        except Exception as exc:
            print(f"  Error: {exc}\n")


def gather_images(paths: list[str]) -> list[Path]:
    results: list[Path] = []
    for raw_path in paths:
        path = Path(raw_path)
        if path.is_dir():
            results.extend(sorted(path.glob("*.jpg")))
            results.extend(sorted(path.glob("*.jpeg")))
            results.extend(sorted(path.glob("*.png")))
        elif path.is_file():
            results.append(path)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Run face-shape debug tests on image files.")
    parser.add_argument("images", nargs="*", help="Image file(s) or directory(ies) to test.")
    parser.add_argument("--hair-type", dest="hair_type", help="Optional hair type filter for recommendations.")
    args = parser.parse_args()

    image_paths = gather_images(args.images) if args.images else []
    if not image_paths:
        default_test_dir = Path(__file__).parent / "test_images"
        if default_test_dir.exists():
            image_paths = gather_images([str(default_test_dir)])

    run_tests(image_paths, hair_type=args.hair_type)


if __name__ == "__main__":
    main()
