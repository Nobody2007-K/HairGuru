import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Share2, RotateCcw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { HairstyleCard } from "@/components/hairstyle-card";
import { hairstyles as localStyles, type Hairstyle } from "@/lib/hairstyles";
import { api, type AnalyzeResponse } from "@/lib/api";

const searchSchema = z.object({
  analysisId: z.coerce.number().optional(),
});

export const Route = createFileRoute("/result")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Your Result · HAIRGURU" }] }),
  component: Result,
});

function Result() {
  const { analysisId } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const result = await api.getAnalysis(analysisId);
        if (result.success) {
          setData(result);
        } else {
          setError(result.error ?? "Could not load results");
        }
      } catch {
        setError("Could not connect to the server");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [analysisId]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </AppShell>
    );
  }

  const faceShape = data?.face_shape;
  const gender = data?.gender;
  // Backend returns confidence as a 0-1 float; render it as a 0-100 percentage.
  const confidenceRaw = data?.confidence ?? 0.96;
  const confidence = Math.round(confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw);
  const recommendations = data?.recommendations ?? [];

  const matches: Hairstyle[] =
    recommendations.length > 0
      ? recommendations
          .map((r) => {
            const local = localStyles.find((s) => s.id === r.id);
            return {
              id: r.id,
              name: r.name,
              image: local?.image ?? `/styles/${r.id}.jfif`,
              match: r.match,
              maintenance: (r.maintenance as "Low" | "Medium" | "High") ?? "Medium",
              stylingTime: local?.stylingTime ?? "5 min",
              bestFor: r.best_for,
              length: (r.length as "Short" | "Medium" | "Long") ?? "Medium",
              hairType: (r.hair_type as "Straight" | "Wavy" | "Curly") ?? "Straight",
              gender: (r.gender ?? local?.gender ?? "Unisex") as "Men" | "Women" | "Unisex",
            };
          })
          .sort((a, b) => b.match - a.match)
          .slice(0, 6)
      : [...localStyles].sort((a, b) => b.match - a.match).slice(0, 6);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-6 sm:p-10 shadow-elegant"
        >
          <div className="absolute inset-0 bg-mesh opacity-30" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center">
            <div className="relative h-40 w-40 mx-auto">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="oklch(1 0 0 / 0.15)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#g)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="276.46"
                  initial={{ strokeDashoffset: 276.46 }}
                  animate={{ strokeDashoffset: 276.46 - 276.46 * (confidence / 100) }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="oklch(0.56 0.24 295)" />
                    <stop offset="100%" stopColor="oklch(0.66 0.22 350)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="font-display text-4xl font-extrabold">{confidence}%</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Confidence</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest opacity-70">Detected face shape</p>
              <h1 className="font-display text-5xl font-extrabold mt-2">{faceShape ?? "Oval"}</h1>
              {gender && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {gender === "Men" ? "♂" : "♀"} Detected: {gender === "Men" ? "Male" : "Female"} · styles tailored for you
                </span>
              )}
              {error && <p className="mt-3 text-pink/80 text-sm">{error}</p>}
              {!error && (
                <p className="mt-3 opacity-90 max-w-md">
                  {faceShape === "Oval" &&
                    "Your face has balanced proportions, so many hairstyles will suit you."}
                  {faceShape === "Round" &&
                    "Your soft curves look great with styles that add height and angles."}
                  {faceShape === "Square" && "Strong jawlines pair well with soft, layered styles."}
                  {faceShape === "Heart" && "Balance a wider forehead with chin-grazing layers."}
                  {faceShape === "Oblong" &&
                    "Add volume on the sides to complement your face length."}
                  {faceShape === "Diamond" &&
                    "Highlight your cheekbones with swept-back or textured styles."}
                  {!faceShape && "Below are your top AI matches based on our analysis."}
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <Button asChild variant="secondary" className="rounded-xl">
                  <Link to="/analyze">
                    <RotateCcw className="h-4 w-4 mr-2" /> Re-scan
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/20 text-white hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-accent" /> Your top matches
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((s, i) => (
              <HairstyleCard key={s.id} style={s} index={i} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
