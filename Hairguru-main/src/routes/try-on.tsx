import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  Share2,
  Upload,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { tryOnHairstyleNames } from "@/lib/hairstyles";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const searchSchema = z.object({
  style: z.string().optional(),
});

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const styleFromSlug = (value?: string) => tryOnHairstyleNames.find((name) => slug(name) === value);

export const Route = createFileRoute("/try-on")({
  validateSearch: searchSchema,
  head: ({ match }) => {
    const styleName = styleFromSlug((match.search as { style?: string }).style);
    const title = styleName ? `Try ${styleName} on you - HAIRGURU` : "Virtual Try-On - HAIRGURU";
    const desc = styleName
      ? `Upload your photo and preview a realistic ${styleName} with AI face-swap.`
      : "Upload your photo and try realistic AI hairstyles with HAIRGURU.";
    const url = styleName ? `/try-on?style=${slug(styleName)}` : "/try-on";

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: TryOn,
});

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image"));
    reader.readAsDataURL(file);
  });
}

function TryOn() {
  const { style: styleParam } = Route.useSearch();
  const navigate = useNavigate({ from: "/try-on" });
  const inputRef = useRef<HTMLInputElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  const initial = useMemo(() => styleFromSlug(styleParam) ?? tryOnHairstyleNames[0], [styleParam]);
  const [selected, setSelected] = useState<string>(initial);
  const [pos, setPos] = useState(50);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = styleFromSlug(styleParam);
    if (next && next !== selected) setSelected(next);
  }, [styleParam, selected]);

  const pickStyle = (name: string) => {
    setSelected(name);
    setResult(null);
    setError(null);
    navigate({ search: { style: slug(name) }, replace: true });
  };

  const onFile = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    setError(null);
    setResult(null);
    setMimeType(file.type);
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    setImageBase64(dataUrl);
  };

  const generate = async () => {
    if (!imageBase64 || !mimeType) {
      setError("Upload a clear face photo first.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await api.tryOn(imageBase64, selected, mimeType);

      if (!res.success || !res.response) {
        throw new Error(res.details || res.error || "Try-on failed");
      }

      setResult(res.response);
      setPos(50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on failed");
    } finally {
      setGenerating(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/try-on?style=${slug(selected)}`
      : `/try-on?style=${slug(selected)}`;

  const onShare = async () => {
    const data = {
      title: `Try ${selected} on you - HAIRGURU`,
      text: `Check out the ${selected} hairstyle on HAIRGURU.`,
      url: shareUrl,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not share this link.");
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `hairguru-${slug(selected)}.png`;
    a.click();
  };

  const move = (clientX: number) => {
    if (!compareRef.current) return;
    const r = compareRef.current.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Wand2 className="h-7 w-7 text-accent" /> Virtual Try-On
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload your photo, choose a hairstyle, and generate a realistic AI face-swap.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={generating || !preview}
            size="lg"
            className="rounded-2xl h-12"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_18rem] gap-5 mt-6">
          <div
            ref={compareRef}
            onMouseMove={(e) => e.buttons === 1 && move(e.clientX)}
            onTouchMove={(e) => move(e.touches[0].clientX)}
            className="relative aspect-[4/5] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-muted shadow-elegant select-none"
          >
            {result ? (
              <img
                src={result}
                alt={`After: ${selected}`}
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-muted">
                <div className="text-center px-6">
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="mt-3 font-semibold">Your try-on result appears here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a photo and press Generate.
                  </p>
                </div>
              </div>
            )}

            {preview && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
              >
                <img
                  src={preview}
                  alt="Before"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </div>
            )}

            {generating && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm grid place-items-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-accent" />
                  <p className="mt-3 font-semibold">Swapping your face onto the style…</p>
                  <p className="mt-1 text-sm text-muted-foreground">Takes a few seconds</p>
                </div>
              </div>
            )}

            <div className="absolute top-3 left-3 glass rounded-full px-3 py-1 text-xs font-semibold">
              Before
            </div>
            <div className="absolute top-3 right-3 glass rounded-full px-3 py-1 text-xs font-semibold">
              After - {selected}
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-elegant"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white grid place-items-center shadow-elegant">
                <div className="flex gap-0.5">
                  <div className="h-3 w-0.5 bg-primary rounded" />
                  <div className="h-3 w-0.5 bg-primary rounded" />
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(+e.target.value)}
              className="absolute inset-0 w-full opacity-0 cursor-ew-resize"
              aria-label="Compare slider"
            />
          </div>

          <aside className="space-y-4">
            <label
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) void onFile(file);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="block rounded-2xl border-2 border-dashed border-glass-border bg-card p-5 text-center cursor-pointer hover:border-accent transition shadow-card"
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onFile(file);
                }}
              />
              <Upload className="h-8 w-8 mx-auto text-accent" />
              <p className="font-semibold mt-3">Upload photo</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP</p>
            </label>

            <Button
              onClick={() => inputRef.current?.click()}
              variant="outline"
              size="lg"
              className="rounded-2xl h-12 w-full"
            >
              <ImageIcon className="h-4 w-4 mr-2" /> Choose file
            </Button>

            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <h2 className="font-display text-lg font-bold mb-3">Pick a style</h2>
              <div className="grid grid-cols-2 gap-2">
                {tryOnHairstyleNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => pickStyle(name)}
                    className={cn(
                      "min-h-11 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-left transition",
                      selected === name
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-glass-border hover:border-accent/60",
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button onClick={download} disabled={!result} size="lg" className="rounded-2xl h-14">
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
          <Button onClick={onShare} variant="outline" size="lg" className="rounded-2xl h-14">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-success" /> Link copied
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 glass rounded-2xl p-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0 pl-2">Shareable link</span>
          <code className="flex-1 truncate text-xs font-mono text-foreground/80">{shareUrl}</code>
          <Button onClick={onShare} size="sm" variant="ghost" className="rounded-xl shrink-0">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
