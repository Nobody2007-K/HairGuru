import { getServerConfig } from "./config.server";

type HairFastResponse = {
  success: boolean;
  response?: string;
  provider?: string;
  detail?: string;
  error?: string;
};

export async function generateWithHairFast(input: { imageBase64: string; hairstyleName: string }) {
  const { hairfastApiUrl } = getServerConfig();
  const base = hairfastApiUrl.replace(/\/$/, "");

  let health: Response;
  try {
    health = await fetch(`${base}/health`);
  } catch {
    throw new Error("HairFastGAN server is not running. Start it with: npm run hairfast");
  }

  if (!health.ok) {
    throw new Error("HairFastGAN server is unavailable.");
  }

  const status = (await health.json()) as { models_ready?: boolean };
  if (!status.models_ready) {
    throw new Error(
      "HairFastGAN models not installed. Run: powershell -File scripts/setup-hairfast.ps1",
    );
  }

  const response = await fetch(`${base}/try-on`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as HairFastResponse & { detail?: string };

  if (!response.ok || !payload.response) {
    throw new Error(payload.detail ?? payload.error ?? "HairFastGAN try-on failed");
  }

  return payload.response;
}
