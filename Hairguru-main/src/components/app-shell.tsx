import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ScanFace, Sparkles, User, Crown, Wand2, Users, LogIn, LogOut } from "lucide-react";
import { ReactNode, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import logoImg from "/logo/logo.png";
import { getStoredUser, setToken, setStoredUser } from "@/lib/api";
import { AuthModal } from "./auth-modal";

const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/analyze", label: "Analyze", icon: ScanFace },
  { to: "/styles", label: "Styles", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
];

const more = [
  { to: "/try-on", label: "Try On", icon: Wand2 },
  { to: "/pricing", label: "Pricing", icon: Crown },
  { to: "/team", label: "Team", icon: Users },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => path === to || (to !== "/home" && path.startsWith(to));
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUserState] = useState(() => getStoredUser());

  const logout = () => {
    setToken(null);
    setStoredUser(null);
    setUserState(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r bg-card/60 backdrop-blur-xl px-4 py-6 z-30">
        <Link to="/" className="flex items-center gap-2 px-2 mb-8">
          <img src={logoImg} alt="HAIRGURU logo" className="h-9 w-9 rounded-xl object-contain" />
          <span className="font-display font-bold text-lg tracking-tight">HAIRGURU</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((i) => {
            const Icon = i.icon;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                  isActive(i.to)
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 pt-6 border-t">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            More
          </p>
          {more.map((i) => {
            const Icon = i.icon;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                  isActive(i.to)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {i.label}
              </Link>
            );
          })}
        </div>

        {user ? (
          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-xl bg-aurora grid place-items-center text-white text-xs font-bold">
                {(user.avatar_initials as string) ??
                  (user.display_name as string)?.slice(0, 2) ??
                  "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {(user.display_name as string) ?? (user.username as string)}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-foreground transition"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto rounded-2xl p-5 bg-aurora text-white shadow-elegant relative overflow-hidden">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -left-2 -bottom-4 h-20 w-20 rounded-full bg-black/10 blur-lg" />
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center mb-3">
                <LogIn className="h-5 w-5" />
              </div>
              <p className="font-display text-base font-bold tracking-tight">Sign in</p>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Save styles and track your history.
              </p>
              <button
                onClick={() => setAuthOpen(true)}
                className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl bg-white text-primary font-bold text-sm py-2.5 hover:bg-white/90 transition shadow-soft"
              >
                Sign in / Register →
              </button>
            </div>
          </div>
        )}
      </aside>

      <header className="lg:hidden sticky top-0 z-30 glass border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="HAIRGURU logo" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-display font-bold tracking-tight">HAIRGURU</span>
          </Link>
          <div className="flex items-center gap-2">
            {!user && (
              <button onClick={() => setAuthOpen(true)} className="text-sm font-medium text-accent">
                Sign in
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="hidden lg:block fixed top-4 right-6 z-40">
        <ThemeToggle />
      </div>

      <main className="lg:pl-64 pb-24 lg:pb-8">{children}</main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {nav.map((i) => {
            const Icon = i.icon;
            const active = isActive(i.to);
            return (
              <Link
                key={i.to}
                to={i.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl grid place-items-center transition",
                    active && "bg-accent/10",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "scale-110")} />
                </div>
                {i.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
