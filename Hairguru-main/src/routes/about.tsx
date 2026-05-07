import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Target, Shield, Zap, Users, Heart } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us · HAIRGURU" },
      {
        name: "description",
        content:
          "Meet the team behind HAIRGURU — the AI-powered hairstyle platform helping people discover their perfect look.",
      },
      { property: "og:title", content: "About Us · HAIRGURU" },
      {
        property: "og:description",
        content:
          "The AI-powered hairstyle platform built to help everyone find their perfect look.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Target,
    title: "Precision",
    body: "Our AI analyzes 68+ facial landmarks to map your unique geometry and deliver recommendations that actually fit.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    body: "Your photos are encrypted, processed in real time, and never stored or shared. Full control, always.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    body: "Get personalized hairstyle suggestions in under 3 seconds — no forms, no waiting, no guesswork.",
  },
  {
    icon: Heart,
    title: "Inclusive by Design",
    body: "Built for every face shape, hair type, gender, and ethnicity. Beauty is universal and so are we.",
  },
];

const stats = [
  { num: "2M+", label: "Photos analyzed" },
  { num: "500K+", label: "Users worldwide" },
  { num: "98%", label: "Satisfaction rate" },
  { num: "3s", label: "Average scan time" },
];

const team = [
  { name: "Aisha M.", role: "Founder & CEO", emoji: "✨" },
  { name: "Leo T.", role: "Head of AI", emoji: "🧠" },
  { name: "Sofia R.", role: "Lead Designer", emoji: "🎨" },
  { name: "Marcus J.", role: "Engineering", emoji: "⚡" },
];

function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <Sparkles className="h-3 w-3 text-accent" /> Our story
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            About HAIRGURU
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
            We believe everyone deserves to feel confident in their hair. HAIRGURU uses cutting-edge
            AI to match you with hairstyles that complement your unique face shape — no salon
            appointment required.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass rounded-2xl p-5 text-center shadow-soft hover:shadow-elegant transition-shadow"
            >
              <div className="font-display text-3xl font-extrabold text-accent">{s.num}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Values */}
        <h2 className="font-display text-2xl font-bold mb-6">What drives us</h2>
        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/40 hover:shadow-elegant transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl bg-accent/10 grid place-items-center mb-4">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-bold text-lg">{v.title}</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{v.body}</p>
              </div>
            );
          })}
        </div>

        {/* Mission */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 mb-14 bg-aurora text-white shadow-elegant">
          <div className="relative z-10">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Our Mission</h2>
            <p className="mt-3 text-sm sm:text-base opacity-90 max-w-xl leading-relaxed">
              To democratize personal styling through AI. We want every person — regardless of
              budget, location, or experience — to walk into a salon with confidence, knowing
              exactly what works for them.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <Sparkles className="h-40 w-40" />
          </div>
        </div>

        {/* Team */}
        <h2 className="font-display text-2xl font-bold mb-6">Meet the crew</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {team.map((t) => (
            <div
              key={t.name}
              className="bg-card rounded-2xl p-5 text-center shadow-card border border-border/40 hover:shadow-elegant transition-shadow"
            >
              <div className="h-14 w-14 rounded-full bg-muted mx-auto grid place-items-center text-2xl mb-3">
                {t.emoji}
              </div>
              <h3 className="font-display font-bold text-sm">{t.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
