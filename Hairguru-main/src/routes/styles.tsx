import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { HairstyleCard } from "@/components/hairstyle-card";
import { hairstyles } from "@/lib/hairstyles";

export const Route = createFileRoute("/styles")({
  head: () => ({ meta: [{ title: "Hairstyle Library · HAIRGURU" }] }),
  component: Styles,
});

type GenderFilter = "All" | "Men" | "Women";

function Styles() {
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<GenderFilter>("All");

  const list = useMemo(() => {
    return hairstyles.filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q.toLowerCase());
      const matchesGender =
        gender === "All" || s.gender === gender || s.gender === "Unisex";
      return matchesQuery && matchesGender;
    });
  }, [q, gender]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="mb-5">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Hairstyle Library</h1>
          <p className="text-muted-foreground">Browse {hairstyles.length} curated styles</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search styles, e.g. quiff…"
            className="pl-11 h-12 rounded-2xl bg-card"
          />
        </div>

        {/* Gender filter */}
        <div className="flex gap-2 mb-6">
          {(["All", "Men", "Women"] as GenderFilter[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                gender === g
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-glass-border text-muted-foreground hover:border-accent/60"
              }`}
            >
              {g === "All" ? "All styles" : g === "Men" ? "♂ Men's" : "♀ Women's"}
            </button>
          ))}
        </div>

        {/* Grid */}
        {list.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.map((s, i) => (
              <HairstyleCard key={s.id} style={s} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-3xl">
            <p className="font-display text-xl font-bold">No styles match</p>
            <p className="text-muted-foreground text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
