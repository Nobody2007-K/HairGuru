import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ScanFace, Crown, DollarSign, TrendingUp, Loader2, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { api, getStoredUser, type AdminStatsResponse } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · HAIRGURU" }] }),
  component: Admin,
});

const defaultStats = {
  total_users: 0,
  total_analyses: 0,
  total_saved: 0,
  today_analyses: 0,
  shape_distribution: [
    { name: "Oval", value: 42 },
    { name: "Round", value: 22 },
    { name: "Square", value: 14 },
    { name: "Heart", value: 12 },
    { name: "Oblong", value: 6 },
    { name: "Diamond", value: 4 },
  ] as { name: string; value: number }[],
  popular_styles: [
    { name: "Textured Crop", count: 1240 },
    { name: "Curtain Bangs", count: 980 },
    { name: "Layered Cut", count: 870 },
    { name: "Modern Quiff", count: 720 },
    { name: "Bob Cut", count: 610 },
  ] as { name: string; count: number }[],
  recent_users: [] as {
    id: number;
    username: string;
    display_name?: string;
    avatar_initials?: string;
    created_at: string;
  }[],
};

function Admin() {
  const [user] = useState(() => getStoredUser());
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getAdminStats();
        if (res.success && res.stats) {
          setStats({
            total_users: res.stats.total_users,
            total_analyses: res.stats.total_analyses,
            total_saved: res.stats.total_saved,
            today_analyses: res.stats.today_analyses,
            shape_distribution:
              res.stats.shape_distribution.length > 0
                ? res.stats.shape_distribution
                : defaultStats.shape_distribution,
            popular_styles:
              res.stats.popular_styles.length > 0
                ? res.stats.popular_styles
                : defaultStats.popular_styles,
            recent_users: res.stats.recent_users,
          });
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const s = stats;

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 text-center">
          <div className="glass rounded-3xl p-8 max-w-md mx-auto">
            <h1 className="font-display text-2xl font-bold">Sign in to access the dashboard</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Admin access requires authentication.
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link to="/">
                <LogIn className="h-4 w-4 mr-2" /> Go Home
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Real-time insights across HAIRGURU</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total users",
              value: s.total_users.toLocaleString(),
              change: "+12.4%",
              icon: Users,
              color: "from-accent to-pink",
            },
            {
              label: "Daily analyses",
              value: s.today_analyses.toLocaleString(),
              change: "+8.1%",
              icon: ScanFace,
              color: "from-pink to-accent",
            },
            {
              label: "Total analyses",
              value: s.total_analyses.toLocaleString(),
              change: "+22.0%",
              icon: Crown,
              color: "from-accent to-success",
            },
            {
              label: "Saved styles",
              value: s.total_saved.toLocaleString(),
              change: "+18.7%",
              icon: DollarSign,
              color: "from-success to-accent",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl bg-card p-5 shadow-card">
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.color} grid place-items-center mb-3`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="font-display text-2xl font-extrabold mt-1">{card.value}</p>
                <p className="text-xs text-success font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {card.change}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-4">Popular face shapes</h2>
            <div className="space-y-3">
              {s.shape_distribution.map((shape) => (
                <div key={shape.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{shape.name}</span>
                    <span className="text-muted-foreground">{shape.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-aurora rounded-full"
                      style={{ width: `${Math.min(shape.value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-4">Popular hairstyles</h2>
            {s.popular_styles.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-48">
                {s.popular_styles.map((p) => {
                  const maxCount = Math.max(...s.popular_styles.map((x) => x.count));
                  return (
                    <div key={p.name} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-xl bg-aurora shadow-glow"
                        style={{ height: `${(p.count / maxCount) * 100}%` }}
                      />
                      <span className="text-[10px] text-center text-muted-foreground leading-tight">
                        {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold mb-4">Recent users</h2>
          {s.recent_users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                    <th className="py-3 px-2">User</th>
                    <th className="py-3 px-2">Username</th>
                    <th className="py-3 px-2 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recent_users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-aurora grid place-items-center text-white text-xs font-bold">
                            {u.avatar_initials ?? u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{u.display_name ?? u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{u.username}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No users yet</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
