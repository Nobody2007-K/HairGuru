import { generateWithHairFast } from "./hairfast.server";

export async function generateAiTryOn(input: { imageBase64: string; hairstyleName: string }) {
  const image = await generateWithHairFast(input);
  return { image, provider: "hairfastgan" as const };
}
