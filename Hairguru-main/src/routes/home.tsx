import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ScanFace, Sparkles, TrendingUp, Crown, ChevronRight, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { HairstyleCard } from "@/components/hairstyle-card";
import { hairstyles } from "@/lib/hairstyles";
import { api, getStoredUser, type MeResponse, type HistoryItem } from "@/lib/api";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home · HAIRGURU" }] }),
  component: Home,
});

function Home() {
  const [user] = useState(() => getStoredUser());
  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const [meRes, histRes] = await Promise.all([api.me(), api.getHistory()]);
          if (meRes.success) setMeData(meRes);
          if (histRes.success && histRes.history) {
            setRecentHistory(histRes.history.slice(0, 1));
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const trending = hairstyles.filter((s) => s.trending).slice(0, 4);

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
          <div>
            <p className="text-sm text-muted-foreground">Welcome to</p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              HAIRGURU
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-aurora p-6 sm:p-8 text-white shadow-elegant"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest opacity-80">AI face analysis</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2 max-w-md">
                Find your perfect hairstyle in 5 seconds
              </h2>
              <Button
                asChild
                className="mt-5 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/20 h-12 px-5"
              >
                <Link to="/analyze">
                  <ScanFace className="h-4 w-4 mr-2" /> Start Analysis
                </Link>
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((s, i) => (
              <HairstyleCard key={s.id} style={s} index={i} />
            ))}
          </div>

          <div className="glass rounded-3xl p-6 flex items-center gap-4 shadow-soft">
            <div className="h-14 w-14 rounded-2xl bg-aurora grid place-items-center shadow-glow shrink-0">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold">Sign in to unlock everything</h3>
              <p className="text-sm text-muted-foreground">Save styles, track history, and more.</p>
            </div>
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/">Get started</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const stats = meData?.stats ?? { analyses_count: 0, saved_count: 0, try_on_count: 0 };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">Good morning ✨</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready for your glow up,{" "}
            {meData?.user?.display_name ?? (user?.display_name as string) ?? ""}?
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-aurora p-6 sm:p-8 text-white shadow-elegant"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest opacity-80">AI face analysis</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2 max-w-md">
              Find your perfect hairstyle in 5 seconds
            </h2>
            <Button
              asChild
              className="mt-5 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/20 h-12 px-5"
            >
              <Link to="/analyze">
                <ScanFace className="h-4 w-4 mr-2" /> Start Analysis
              </Link>
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Analyses", v: String(stats.analyses_count) },
            { l: "Saved", v: String(stats.saved_count) },
            { l: "Try-ons", v: String(stats.try_on_count) },
          ].map((s) => (
            <div key={s.l} className="glass rounded-2xl p-4 text-center">
              <p className="font-display text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {recentHistory.length > 0 && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-aurora grid place-items-center text-white text-sm font-bold">
              {recentHistory[0].face_shape[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Last analysis: {recentHistory[0].face_shape}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(recentHistory[0].created_at).toLocaleDateString()}
              </p>
            </div>
            <Link to="/result" search={{ analysisId: recentHistory[0].id }}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" /> Trending now
            </h2>
            <Link to="/styles" className="text-sm text-accent flex items-center gap-1">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((s, i) => (
              <HairstyleCard key={s.id} style={s} index={i} />
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 flex items-center gap-4 shadow-soft">
          <div className="h-14 w-14 rounded-2xl bg-aurora grid place-items-center shadow-glow shrink-0">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold">Unlock unlimited analyses</h3>
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium for HD try-on & history.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <Link to="/pricing">Upgrade</Link>
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> Meet the Team
            </h2>
            <Link to="/team" className="text-sm text-accent flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-card shadow-card p-4 flex flex-col items-center text-center gap-3"
              >
                {m.photo ? (
                  <div className="h-16 w-16 rounded-xl overflow-hidden shadow-glow">
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div
                    className={`h-16 w-16 rounded-xl bg-gradient-to-br ${m.gradient} grid place-items-center shadow-glow`}
                  >
                    <span className="text-white font-display text-lg font-bold">{m.initials}</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm leading-tight">{m.name}</p>
                  <p className="text-xs text-accent font-medium mt-0.5">{m.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
