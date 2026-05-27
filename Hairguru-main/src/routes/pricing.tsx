import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing · HAIRGURU" }] }),
  component: Pricing,
});

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Get started with the basics.",
    features: [
      "3 analyses per month",
      "Basic recommendations",
      "Save up to 5 styles",
      "Standard quality",
    ],
    cta: "Current plan",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$9",
    period: "/mo",
    desc: "Unlock the full HAIRGURU experience.",
    features: [
      "Unlimited face analyses",
      "Virtual try-on",
      "HD downloads",
      "Saved style history",
      "Early access to new styles",
      "Priority support",
    ],
    cta: "Go Premium",
    highlight: true,
  },
];

function Pricing() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <Sparkles className="h-3 w-3 text-accent" /> Simple pricing
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            Choose your plan
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Start free, upgrade anytime. Cancel whenever.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 shadow-card ${p.highlight ? "bg-primary text-primary-foreground shadow-elegant" : "bg-card"}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-aurora text-white text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 shadow-glow">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                {p.highlight && <Crown className="h-5 w-5" />}
                <h2 className="font-display text-2xl font-bold">{p.name}</h2>
              </div>
              <p className={p.highlight ? "opacity-80 text-sm" : "text-muted-foreground text-sm"}>
                {p.desc}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold">{p.price}</span>
                {p.period && (
                  <span className={p.highlight ? "opacity-70" : "text-muted-foreground"}>
                    {p.period}
                  </span>
                )}
              </div>
              <Button
                className={`mt-6 w-full rounded-xl h-12 font-bold text-base ${p.highlight ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90 shadow-glow border-0" : ""}`}
                variant={p.highlight ? "default" : "outline"}
              >
                {p.highlight && <Crown className="h-4 w-4 mr-2 text-yellow-300" />}
                {p.cta}
              </Button>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "text-white" : "text-success"}`}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
