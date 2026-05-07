import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Github, Linkedin, Twitter } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team · HAIRGURU" }] }),
  component: Team,
});

const members: {
  name: string;
  role: string;
  bio: string;
  initials: string;
  gradient: string;
  photo?: string;
}[] = [
  {
    name: "Kashish Shrestha",
    role: "Backend / Database",
    bio: "Architects the server-side logic and database systems that keep HAIRGURU fast and reliable.",
    initials: "KS",
    gradient: "from-violet-500 to-purple-600",
    photo: "/team/kashish.jpg",
  },
  {
    name: "Rosh Rana Magar",
    role: "Videographer / Testing",
    bio: "Captures visual content and leads quality assurance to ensure every feature ships polished.",
    initials: "RRM",
    gradient: "from-pink-500 to-rose-600",
    photo: "/team/rosh.jpg",
  },
  {
    name: "Susan Khanal",
    role: "Frontend & UI/UX",
    bio: "Designs and builds the user interface, blending aesthetic precision with intuitive interaction.",
    initials: "SK",
    gradient: "from-sky-500 to-blue-600",
    photo: "/team/susan.jpg",
  },
  {
    name: "Aaryan Acharya",
    role: "AI / ML",
    bio: "Develops and trains the machine learning models behind HAIRGURU's face-shape detection engine.",
    initials: "AA",
    gradient: "from-emerald-500 to-teal-600",
    photo: "/team/aaryan.png",
  },
];

function Team() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground">The people behind the magic ✨</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Meet the Team
          </h1>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {members.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl bg-card shadow-card p-6 flex flex-col items-center text-center gap-4 hover:shadow-elegant transition-shadow"
            >
              {/* Avatar */}
              {member.photo ? (
                <div className="h-24 w-24 rounded-2xl overflow-hidden shadow-glow">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              ) : (
                <div
                  className={`h-24 w-24 rounded-2xl bg-gradient-to-br ${member.gradient} grid place-items-center shadow-glow`}
                >
                  <span className="text-white font-display text-2xl font-bold">
                    {member.initials}
                  </span>
                </div>
              )}

              {/* Info */}
              <div>
                <h2 className="font-display text-xl font-bold">{member.name}</h2>
                <p className="text-sm font-semibold text-accent mt-0.5">{member.role}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{member.bio}</p>
              </div>

              {/* Social links (dummy) */}
              <div className="flex items-center gap-3 mt-auto">
                <button className="h-9 w-9 rounded-xl bg-muted grid place-items-center text-muted-foreground hover:bg-accent/10 hover:text-accent transition">
                  <Github className="h-4 w-4" />
                </button>
                <button className="h-9 w-9 rounded-xl bg-muted grid place-items-center text-muted-foreground hover:bg-accent/10 hover:text-accent transition">
                  <Linkedin className="h-4 w-4" />
                </button>
                <button className="h-9 w-9 rounded-xl bg-muted grid place-items-center text-muted-foreground hover:bg-accent/10 hover:text-accent transition">
                  <Twitter className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <div className="glass rounded-3xl p-6 text-center shadow-soft">
          <p className="text-muted-foreground text-sm">
            Built with passion in Nepal 🇳🇵 — combining AI and great design to help everyone find
            their perfect look.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
