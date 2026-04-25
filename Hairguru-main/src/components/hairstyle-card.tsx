import { Bookmark, Wand2, Clock, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Hairstyle } from "@/lib/hairstyles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HairstyleCard({ style, index = 0 }: { style: Hairstyle; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group rounded-3xl overflow-hidden bg-card shadow-card hover:shadow-elegant transition-all"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={style.image}
          alt={style.name}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition duration-700"
        />
        <div className="absolute top-3 left-3 glass rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> {style.match}% match
        </div>
        <button
          className="absolute top-3 right-3 h-9 w-9 rounded-full glass grid place-items-center hover:bg-pink hover:text-pink-foreground transition"
          aria-label="Save"
        >
          <Bookmark className="h-4 w-4" />
        </button>
        <span className="absolute bottom-3 right-3 glass rounded-full px-2.5 py-1 text-[11px] font-semibold">
          {style.gender === "Men" ? "♂ Men" : style.gender === "Women" ? "♀ Women" : "Unisex"}
        </span>
        {style.trending && (
          <Badge className="absolute bottom-3 left-3 bg-gradient-to-r from-accent to-pink text-white border-0">
            🔥 Trending
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-bold text-base">{style.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Best for {style.bestFor.join(", ")}
          </p>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" /> {style.maintenance}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {style.stylingTime}
          </span>
        </div>
        <Button asChild size="sm" className="w-full rounded-xl">
          <Link to="/try-on" search={{ style: style.id }}>
            <Wand2 className="h-4 w-4 mr-1" /> Try Preview
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
