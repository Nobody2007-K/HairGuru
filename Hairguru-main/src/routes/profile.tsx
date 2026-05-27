import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Crown,
  Heart,
  History,
  Settings,
  ChevronRight,
  Sparkles,
  LogIn,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { hairstyles } from "@/lib/hairstyles";
import { api, getStoredUser, type HistoryItem, type SavedStyleItem } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · HAIRGURU" }] }),
  component: Profile,
});

function Profile() {
  const [user] = useState(() => getStoredUser());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saved, setSaved] = useState<SavedStyleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, savedRes] = await Promise.all([api.getHistory(), api.getSaved()]);
        if (histRes.success && histRes.history) {
          setHistory(histRes.history.slice(0, 10));
        }
        if (savedRes.success && savedRes.saved_styles) {
          setSaved(savedRes.saved_styles);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayName = (user?.display_name as string) ?? "Guest";
  const initials = (user?.avatar_initials as string) ?? "G";
  const email = user ? `${user.username}@hairguru.app` : "Sign in to save your styles";

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          <div className="glass rounded-3xl p-8 text-center shadow-soft">
            <div className="h-20 w-20 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold">Sign in to see your profile</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Save your styles and track your analysis history.
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link to="/">
                <LogIn className="h-4 w-4 mr-2" /> Go to Home
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const savedStyles =
    saved.length > 0
      ? saved.map((s) => {
          const match = hairstyles.find((h) => h.id === s.style_id || h.name === s.style_name);
          return (
            match ?? {
              id: s.style_id ?? s.style_name,
              name: s.style_name,
              image: s.image_url ?? "/styles/Texture_Crop.jfif",
              match: 0,
              maintenance: "Medium" as const,
              stylingTime: "5 min",
              bestFor: [],
              gender: "Unisex" as const,
              length: "Medium" as const,
              hairType: "Straight" as const,
            }
          );
        })
      : hairstyles.slice(0, 4);

  const historyList = history.length > 0 ? history : [];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="glass rounded-3xl p-6 flex items-center gap-4 shadow-soft">
          <div className="h-20 w-20 rounded-2xl bg-aurora grid place-items-center shadow-glow shrink-0">
            <span className="font-display font-bold text-2xl text-white">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
            {historyList.length > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs glass rounded-full px-2.5 py-1">
                <Sparkles className="h-3 w-3 text-accent" /> Last shape:{" "}
                <span className="font-semibold">{historyList[0].face_shape}</span>
              </div>
            )}
          </div>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-aurora p-6 text-white shadow-elegant">
          <Crown className="h-8 w-8 mb-3" />
          <h2 className="font-display text-xl font-bold">Upgrade to Premium</h2>
          <p className="text-sm opacity-90 mt-1">Unlimited analyses, HD try-on, saved history.</p>
          <Button asChild className="mt-4 rounded-xl bg-white text-primary hover:bg-white/90">
            <Link to="/pricing">View plans</Link>
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink" /> Saved styles
            </h2>
            <Link to="/styles" className="text-sm text-accent">
              All
            </Link>
          </div>
          {savedStyles.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {savedStyles.map((s) => (
                <div key={s.id} className="rounded-2xl overflow-hidden shadow-card">
                  <img src={s.image} alt={s.name} className="aspect-square w-full object-cover" />
                  <p className="text-xs font-semibold py-2 px-1.5 text-center bg-card">{s.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No saved styles yet</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-3">
            <History className="h-5 w-5 text-accent" /> Analysis history
          </h2>
          {historyList.length > 0 ? (
            <div className="space-y-2">
              {historyList.map((h) => (
                <Link
                  key={h.id}
                  to="/result"
                  search={{ analysisId: h.id }}
                  className="block glass rounded-2xl p-4 flex items-center gap-4 hover:shadow-soft transition"
                >
                  <div className="h-10 w-10 rounded-xl bg-aurora grid place-items-center text-white text-sm font-bold">
                    {h.face_shape[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{h.face_shape}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString()} ·{" "}
                      {Math.round(h.confidence * 100)}% confidence · {h.engine_used}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No analyses yet.{" "}
                <Link to="/analyze" className="text-accent">
                  Start one now
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
