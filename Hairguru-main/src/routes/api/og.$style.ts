import { createFileRoute } from "@tanstack/react-router";
import { hairstyles } from "@/lib/hairstyles";

export const Route = createFileRoute("/api/og/$style")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.style.replace(/\.svg$/i, "");
        const style = hairstyles.find((s) => s.id === id);

        const title = style?.name ?? "HAIRGURU";
        const subtitle = style
          ? `${style.match}% match · Best for ${style.bestFor.join(" & ")}`
          : "Find Your Perfect Hairstyle with AI";
        const meta = style
          ? `${style.gender} · ${style.length} · ${style.hairType} · ${style.maintenance} maintenance`
          : "AI-powered hairstyle recommendations";

        const esc = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B1020"/>
      <stop offset="55%" stop-color="#1A1140"/>
      <stop offset="100%" stop-color="#3B1052"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.15" cy="0.2" r="0.6">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.95" cy="0.95" r="0.7">
      <stop offset="0%" stop-color="#EC4899" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#EC4899" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#F472B6"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.04"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <!-- soft blurred orbs -->
  <circle cx="980" cy="180" r="160" fill="#EC4899" opacity="0.25" filter="url(#blur)"/>
  <circle cx="220" cy="500" r="180" fill="#7C3AED" opacity="0.30" filter="url(#blur)"/>

  <!-- brand -->
  <g transform="translate(72,72)">
    <circle cx="22" cy="22" r="22" fill="url(#ring)"/>
    <circle cx="22" cy="22" r="10" fill="#0B1020"/>
    <text x="62" y="32" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="800" fill="#FFFFFF" letter-spacing="3">HAIRGURU</text>
  </g>

  <!-- tag chip -->
  <g transform="translate(72,150)">
    <rect width="220" height="44" rx="22" fill="url(#card)" stroke="#FFFFFF" stroke-opacity="0.18"/>
    <circle cx="22" cy="22" r="5" fill="#22D3EE"/>
    <text x="40" y="29" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="600" fill="#E5E7EB" letter-spacing="1.5">AI HAIRSTYLE PREVIEW</text>
  </g>

  <!-- title -->
  <text x="72" y="300" font-family="Inter, system-ui, sans-serif" font-size="96" font-weight="800" fill="#FFFFFF" letter-spacing="-2">${esc(title)}</text>

  <!-- subtitle -->
  <text x="72" y="360" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="600" fill="#F472B6">${esc(subtitle)}</text>

  <!-- meta -->
  <text x="72" y="410" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="500" fill="#CBD5E1">${esc(meta)}</text>

  <!-- match ring -->
  ${
    style
      ? `<g transform="translate(940,300)">
    <circle r="130" fill="url(#card)" stroke="#FFFFFF" stroke-opacity="0.15"/>
    <circle r="100" fill="none" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="14"/>
    <circle r="100" fill="none" stroke="url(#ring)" stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${(style.match / 100) * 2 * Math.PI * 100} ${2 * Math.PI * 100}"
      transform="rotate(-90)"/>
    <text text-anchor="middle" y="6" font-family="Inter, system-ui, sans-serif" font-size="58" font-weight="800" fill="#FFFFFF">${style.match}%</text>
    <text text-anchor="middle" y="40" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="#E5E7EB" letter-spacing="2">MATCH</text>
  </g>`
      : ""
  }

  <!-- footer CTA -->
  <g transform="translate(72,520)">
    <rect width="360" height="62" rx="31" fill="#FFFFFF"/>
    <text x="180" y="40" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="#0B1020">Try it on your photo →</text>
  </g>
  <text x="72" y="610" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="500" fill="#94A3B8">hairguru.app · Find Your Perfect Hairstyle with AI</text>
</svg>`;

        return new Response(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
          },
        });
      },
    },
  },
});
