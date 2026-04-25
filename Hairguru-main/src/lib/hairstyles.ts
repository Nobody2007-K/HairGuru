// Dedicated per-style images (these are the correct, gender-appropriate photos;
// the /styles/*.jfif files are all men's cuts and must NOT be used for women's styles).
import imgTexturedCrop from "@/assets/style-textured-crop.jpg";
import imgQuiff from "@/assets/style-quiff.jpg";
import imgSidePart from "@/assets/style-side-part.jpg";
import imgPompadour from "@/assets/style-pompadour.jpg";
import imgBuzz from "@/assets/style-buzz.jpg";
import imgLayered from "@/assets/style-layered.jpg";
import imgCurtain from "@/assets/style-curtain.jpg";
import imgWolf from "@/assets/style-wolf.jpg";
import imgBob from "@/assets/style-bob.jpg";
import imgPixie from "@/assets/style-pixie.jpg";

export type Hairstyle = {
  id: string;
  name: string;
  image: string;
  match: number;
  maintenance: "Low" | "Medium" | "High";
  stylingTime: string;
  bestFor: string[];
  gender: "Men" | "Women" | "Unisex";
  length: "Short" | "Medium" | "Long";
  hairType: "Straight" | "Wavy" | "Curly";
  trending?: boolean;
};

export const hairstyles: Hairstyle[] = [
  {
    id: "textured-crop",
    name: "Textured Crop",
    image: imgTexturedCrop,
    match: 96,
    maintenance: "Low",
    stylingTime: "3 min",
    bestFor: ["Oval", "Square"],
    gender: "Men",
    length: "Short",
    hairType: "Straight",
    trending: true,
  },
  {
    id: "modern-quiff",
    name: "Modern Quiff",
    image: imgQuiff,
    match: 93,
    maintenance: "Medium",
    stylingTime: "7 min",
    bestFor: ["Oval", "Oblong"],
    gender: "Men",
    length: "Short",
    hairType: "Wavy",
    trending: true,
  },
  {
    id: "side-part",
    name: "Side Part",
    image: imgSidePart,
    match: 91,
    maintenance: "Low",
    stylingTime: "4 min",
    bestFor: ["Oval", "Round"],
    gender: "Men",
    length: "Short",
    hairType: "Straight",
  },
  {
    id: "pompadour",
    name: "Pompadour",
    image: imgPompadour,
    match: 89,
    maintenance: "High",
    stylingTime: "10 min",
    bestFor: ["Square", "Oval"],
    gender: "Men",
    length: "Medium",
    hairType: "Straight",
  },
  {
    id: "buzz-cut",
    name: "Buzz Cut",
    image: imgBuzz,
    match: 84,
    maintenance: "Low",
    stylingTime: "1 min",
    bestFor: ["Oval", "Diamond"],
    gender: "Men",
    length: "Short",
    hairType: "Straight",
  },
  {
    id: "layered-cut",
    name: "Layered Cut",
    image: imgLayered,
    match: 95,
    maintenance: "Medium",
    stylingTime: "8 min",
    bestFor: ["Oval", "Heart"],
    gender: "Women",
    length: "Long",
    hairType: "Wavy",
    trending: true,
  },
  {
    id: "curtain-bangs",
    name: "Curtain Bangs",
    image: imgCurtain,
    match: 92,
    maintenance: "Medium",
    stylingTime: "6 min",
    bestFor: ["Round", "Heart"],
    gender: "Unisex",
    length: "Long",
    hairType: "Straight",
    trending: true,
  },
  {
    id: "wolf-cut",
    name: "Wolf Cut",
    image: imgWolf,
    match: 88,
    maintenance: "Medium",
    stylingTime: "7 min",
    bestFor: ["Oval", "Square"],
    gender: "Unisex",
    length: "Medium",
    hairType: "Wavy",
    trending: true,
  },
  {
    id: "bob-cut",
    name: "Bob Cut",
    image: imgBob,
    match: 90,
    maintenance: "Low",
    stylingTime: "5 min",
    bestFor: ["Heart", "Oval"],
    gender: "Women",
    length: "Medium",
    hairType: "Straight",
  },
  {
    id: "pixie-cut",
    name: "Pixie Cut",
    image: imgPixie,
    match: 87,
    maintenance: "Low",
    stylingTime: "4 min",
    bestFor: ["Heart", "Oval"],
    gender: "Women",
    length: "Short",
    hairType: "Straight",
  },
];

// Styles backed by a real-photo template that the face-swap try-on can use
// (validated to have a detectable face). Keep in sync with
// backend/app/services/tryon_references.py.
export const tryOnHairstyleNames = [
  "Buzz Cut",
  "Crew Cut",
  "French Crop",
  "Textured Crop",
  "Low Fade",
  "Mid Fade",
  "High Fade",
  "Pompadour",
  "Quiff",
  "Slick Back",
  "Side Part",
  "Wolf Cut",
  "Layered",
] as const;

export const faceShapes = ["Oval", "Round", "Square", "Heart", "Oblong", "Diamond"] as const;
