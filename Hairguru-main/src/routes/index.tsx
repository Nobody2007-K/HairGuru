import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  ScanFace,
  Wand2,
  ShieldCheck,
  Zap,
  Star,
  ArrowRight,
  Users,
  LogIn,
} from "lucide-react";
import { useState } from "react";
import heroImg from "@/assets/hero-scan.jpg";
import logoImg from "/logo/logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStoredUser } from "@/lib/api";
import { AuthModal } from "@/components/auth-modal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HAIRGURU — Find Your Perfect Hairstyle with AI" },
      {
        name: "description",
        content:
          "Upload your photo and let HAIRGURU analyze your face shape to recommend hairstyles that truly fit you.",
      },
      { property: "og:title", content: "HAIRGURU — AI Hairstyle Recommendations" },
      {
        property: "og:description",
        content: "Discover the hairstyle made for your face shape, powered by AI.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const user = getStoredUser();

  return (
    <div className="min-h-screen bg-mesh">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="HAIRGURU logo" className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-display font-extrabold tracking-tight text-lg">HAIRGURU</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/styles" className="hover:text-accent">
              Styles
            </Link>
            <Link to="/pricing" className="hover:text-accent">
              Pricing
            </Link>
            <Link to="/admin" className="hover:text-accent">
              Dashboard
            </Link>
            <Link to="/team" className="hover:text-accent">
              Team
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/home">{(user.display_name as string) ?? (user.username as string)}</Link>
              </Button>
            ) : (
              <Button
                onClick={() => setAuthOpen(true)}
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <LogIn className="h-4 w-4 mr-1" /> Sign in
              </Button>
            )}
            <ThemeToggle />
            <Button asChild size="sm" className="rounded-full bg-primary">
              <Link to="/analyze">Try Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              AI Beauty Tech · v2.0
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
              Discover the <span className="text-gradient">Hairstyle</span> Made for Your Face
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Upload your photo and let HAIRGURU analyze your face shape to recommend styles that
              truly fit you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-2xl h-14 px-7 text-base bg-primary shadow-elegant"
              >
                <Link to="/analyze">
                  <ScanFace className="h-5 w-5 mr-2" /> Start Face Analysis
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl h-14 px-7 text-base glass border-glass-border"
              >
                <Link to="/styles">
                  <Sparkles className="h-5 w-5 mr-2" /> Explore Hairstyles
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full border-2 border-background bg-aurora"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-foreground font-semibold">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-pink text-pink" />
                  ))}
                  <span className="ml-1">4.9</span>
                </div>
                <p>120k+ analyses this week</p>
              </div>
            </div>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto"
          >
            <div className="absolute -inset-10 bg-gradient-to-tr from-accent/30 via-pink/20 to-transparent blur-3xl -z-10" />
            <div className="relative w-[280px] sm:w-[320px] h-[600px] rounded-[3rem] bg-primary p-3 shadow-elegant">
              <div className="relative h-full w-full rounded-[2.4rem] overflow-hidden bg-background">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-primary z-20" />
                <img
                  src={heroImg}
                  alt="AI face scan"
                  className="absolute inset-0 h-full w-full object-cover"
                  width={1024}
                  height={1280}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                {/* Scan line */}
                <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent/40 to-transparent animate-scan" />

                {/* Face shape badge */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-20 left-4 glass rounded-2xl px-3 py-2 shadow-soft"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Face Shape
                  </p>
                  <p className="font-display font-bold">Oval · 96%</p>
                </motion.div>

                {/* Floating style card */}
                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="absolute bottom-24 right-4 glass rounded-2xl p-3 w-40 shadow-elegant animate-float"
                >
                  <div className="h-16 rounded-xl bg-aurora mb-2" />
                  <p className="text-xs font-bold">Textured Crop</p>
                  <p className="text-[10px] text-muted-foreground">96% match</p>
                </motion.div>

                {/* Bottom pill */}
                <div className="absolute bottom-6 left-4 right-4 glass rounded-2xl py-3 px-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-aurora grid place-items-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">10 styles ready</p>
                    <p className="text-[10px] text-muted-foreground">Tap to view</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </div>

                {/* Pulse ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full border-2 border-accent/40 animate-pulse-ring" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Zap,
              title: "Instant analysis",
              desc: "Get results in under 5 seconds with on-device face shape detection.",
            },
            {
              icon: ShieldCheck,
              title: "Private by default",
              desc: "Photos are processed for analysis only — never shared or sold.",
            },
            {
              icon: Wand2,
              title: "Virtual try-on",
              desc: "Preview styles on your photo before booking the chair.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-6 shadow-soft"
            >
              <div className="h-11 w-11 rounded-2xl bg-aurora grid place-items-center shadow-glow mb-4">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <Users className="h-3.5 w-3.5 text-accent" /> The Builders
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Meet the Team
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            The people who built HAIRGURU from the ground up.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              name: "Kashish Shrestha",
              role: "Backend / Database",
              initials: "KS",
              gradient: "from-violet-500 to-purple-600",
              photo: "/team/kashish.jpg",
            },
            {
              name: "Rosh Rana Magar",
              role: "Videographer / Testing",
              initials: "RRM",
              gradient: "from-pink-500 to-rose-600",
              photo: "/team/rosh.jpg",
            },
            {
              name: "Susan Khanal",
              role: "Frontend & UI/UX",
              initials: "SK",
              gradient: "from-sky-500 to-blue-600",
              photo: "/team/susan.jpg",
            },
            {
              name: "Aaryan Acharya",
              role: "AI / ML",
              initials: "AA",
              gradient: "from-emerald-500 to-teal-600",
              photo: "/team/aaryan.png",
            },
          ].map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-soft"
            >
              {m.photo ? (
                <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-glow">
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              ) : (
                <div
                  className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${m.gradient} grid place-items-center shadow-glow`}
                >
                  <span className="text-white font-display text-xl font-bold">{m.initials}</span>
                </div>
              )}
              <div>
                <p className="font-display font-bold">{m.name}</p>
                <p className="text-xs text-accent font-semibold mt-1">{m.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 HAIRGURU · AI Beauty Studio
      </footer>
    </div>
  );
}
