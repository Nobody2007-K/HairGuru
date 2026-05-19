import process from "node:process";

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hairfastApiUrl: process.env.HAIRFAST_API_URL ?? "http://localhost:8000",
  };
}
