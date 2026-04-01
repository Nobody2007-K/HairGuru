export type FaceShape = "Oval" | "Round" | "Square" | "Heart" | "Oblong" | "Diamond";

export type FaceAnalysis = {
  faceShape: FaceShape;
  confidence: number;
  recommendations: HairstyleRecommendation[];
};

export type HairstyleRecommendation = {
  id: string;
  name: string;
  match: number;
  bestFor: string[];
  hairType: string;
  length: string;
};

export { analyzeFaceShape } from "./faceShapeEngine.js";
export { recommendHairstyles } from "./hairstyleRecommender.js";
export type { HairstyleRecommendation } from "./hairstyleRecommender.js";
