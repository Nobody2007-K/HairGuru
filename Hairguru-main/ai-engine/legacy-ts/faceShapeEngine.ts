import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import {
  detectFaceShapeFromLandmarks,
  FaceShape,
  recommendHairstyles,
} from "./hairstyleRecommender.js";

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

export async function loadFaceLandmarksModel() {
  if (detector) {
    return detector;
  }

  await tf.setBackend("webgl");
  detector = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: "tfjs",
      maxFaces: 1,
    },
  );

  return detector;
}

export async function analyzeFaceShape(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
) {
  const model = await loadFaceLandmarksModel();
  const faces = await model.estimateFaces({ input, flipHorizontal: false });

  if (!faces.length || !faces[0].keypoints) {
    throw new Error("No face found in the provided image.");
  }

  const shape = detectFaceShapeFromLandmarks(faces[0].keypoints);
  const recommendations = recommendHairstyles(shape);

  return {
    faceShape: shape,
    confidence: faces[0].faceInViewConfidence ?? 0.95,
    recommendations,
  };
}
