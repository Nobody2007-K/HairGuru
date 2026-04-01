export type FaceShape = "Oval" | "Round" | "Square" | "Heart" | "Oblong" | "Diamond";

export type HairstyleRecommendation = {
  id: string;
  name: string;
  match: number;
  bestFor: FaceShape[];
  hairType: string;
  length: string;
  maintenance: string;
};

const hairstyles: HairstyleRecommendation[] = [
  {
    id: "curtain-bangs",
    name: "Curtain Bangs",
    match: 92,
    bestFor: ["Round", "Heart"],
    hairType: "Straight",
    length: "Long",
    maintenance: "Medium",
  },
  {
    id: "bob-cut",
    name: "Bob Cut",
    match: 90,
    bestFor: ["Heart", "Oval"],
    hairType: "Straight",
    length: "Medium",
    maintenance: "Low",
  },
  {
    id: "textured-crop",
    name: "Textured Crop",
    match: 96,
    bestFor: ["Oval", "Square"],
    hairType: "Straight",
    length: "Short",
    maintenance: "Low",
  },
  {
    id: "wolf-cut",
    name: "Wolf Cut",
    match: 88,
    bestFor: ["Oval", "Square"],
    hairType: "Wavy",
    length: "Medium",
    maintenance: "Medium",
  },
  {
    id: "pixie-cut",
    name: "Pixie Cut",
    match: 87,
    bestFor: ["Heart", "Oval"],
    hairType: "Straight",
    length: "Short",
    maintenance: "Low",
  },
  {
    id: "modern-quiff",
    name: "Modern Quiff",
    match: 93,
    bestFor: ["Oval", "Oblong"],
    hairType: "Wavy",
    length: "Short",
    maintenance: "Medium",
  },
];

export function detectFaceShapeFromLandmarks(keypoints: Array<{ x: number; y: number }>) {
  const leftJaw = keypoints[234];
  const rightJaw = keypoints[454];
  const chin = keypoints[152];
  const leftCheek = keypoints[93];
  const rightCheek = keypoints[323];
  const forehead = keypoints[10];

  const faceWidth = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);
  const jawWidth = Math.hypot(rightJaw.x - leftJaw.x, rightJaw.y - leftJaw.y);
  const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);
  const jawToCheek = (jawWidth + faceWidth) / 2;
  const ratio = faceHeight / jawToCheek;

  if (ratio > 1.4) {
    return "Oblong" as FaceShape;
  }

  const jawChinRatio = jawWidth / faceWidth;
  const foreheadChinRatio = Math.hypot(forehead.x - chin.x, forehead.y - chin.y) / faceWidth;

  if (jawChinRatio > 0.95 && foreheadChinRatio > 0.75) {
    return "Square" as FaceShape;
  }

  if (jawChinRatio < 0.8 && foreheadChinRatio > 0.78) {
    return "Heart" as FaceShape;
  }

  if (jawChinRatio < 0.86 && foreheadChinRatio < 0.78) {
    return "Oval" as FaceShape;
  }

  if (jawWidth < faceWidth * 0.85) {
    return "Diamond" as FaceShape;
  }

  return "Round" as FaceShape;
}

export function recommendHairstyles(faceShape: FaceShape, hairType?: string) {
  const candidates = hairstyles.filter((style) => style.bestFor.includes(faceShape));
  const filtered = hairType
    ? candidates.filter((style) => style.hairType.toLowerCase() === hairType.toLowerCase())
    : candidates;
  const result = filtered.length > 0 ? filtered : candidates.length > 0 ? candidates : hairstyles;
  return result.sort((a, b) => b.match - a.match).slice(0, 5);
}
