import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  ShieldCheck,
  Image as ImageIcon,
  Check,
  X,
  ZoomIn,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCamera } from "@/hooks/useCamera";

export const Route = createFileRoute("/analyze")({
  head: () => ({ meta: [{ title: "Analyze · HAIRGURU" }] }),
  component: Analyze,
});

const STEPS = [
  "Detecting face",
  "Reading facial landmarks",
  "Measuring face ratio",
  "Finding face shape",
  "Preparing hairstyle matches",
];

type Phase = "upload" | "scanning" | "error" | "done";

type GenderPref = "Men" | "Women" | null;

function Analyze() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [genderPref, setGenderPref] = useState<GenderPref>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const camera = useCamera();

  const reset = useCallback(() => {
    setPhase("upload");
    setPreview(null);
    setImageData(null);
    setStep(0);
    setAnalyzeError(null);
  }, []);

  const startAnalysis = useCallback(async (data: string) => {
    setPhase("scanning");
    setImageData(data);
  }, []);

  const onFile = useCallback((f: File) => {
    setAnalyzeError(null);
    setPreview(URL.createObjectURL(f));
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      startAnalysis(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(f);
  }, [startAnalysis]);

  const onCameraCapture = useCallback(() => {
    const dataUrl = camera.capture();
    if (!dataUrl) return;
    setAnalyzeError(null);
    setPreview(dataUrl);
    startAnalysis(dataUrl.split(",")[1]);
  }, [camera, startAnalysis]);

  const doAnalyze = useCallback(async () => {
    if (!imageData) return;
    try {
      const result = await api.analyze(imageData, undefined, genderPref ?? undefined);
      if (result.success && result.analysis_id) {
        setPhase("done");
        navigate({ to: "/result", search: { analysisId: result.analysis_id } });
      } else {
        setAnalyzeError(result.error ?? "Analysis failed. Please try again.");
        setPhase("error");
      }
    } catch {
      setAnalyzeError("Could not connect to analysis server. Make sure the backend is running.");
      setPhase("error");
    }
  }, [imageData, navigate, genderPref]);

  useEffect(() => {
    if (phase !== "scanning") return;
    if (step >= STEPS.length) {
      doAnalyze();
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [phase, step, doAnalyze]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Face Analysis</h1>
        <p className="text-muted-foreground mt-1">Upload a clear front-facing photo to begin.</p>

        <AnimatePresence mode="wait">
          {phase === "upload" && (
            <UploadPhase
              inputRef={inputRef}
              onFile={onFile}
              onOpenCamera={camera.openCamera}
              genderPref={genderPref}
              onGenderChange={setGenderPref}
            />
          )}

          {(phase === "scanning" || phase === "done") && (
            <ScanningPhase
              preview={preview}
              step={step}
              steps={STEPS}
            />
          )}

          {phase === "error" && (
            <ErrorPhase
              preview={preview}
              step={step}
              steps={STEPS}
              error={analyzeError}
              onRetry={reset}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {camera.open && (
          <CameraModal
            videoRef={camera.videoRef}
            error={camera.error}
            facingMode={camera.facingMode}
            onCapture={onCameraCapture}
            onClose={camera.close}
            onFlip={camera.flip}
            onRetry={() => camera.retry()}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function UploadPhase({
  inputRef,
  onFile,
  onOpenCamera,
  genderPref,
  onGenderChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
  onOpenCamera: () => void;
  genderPref: GenderPref;
  onGenderChange: (g: GenderPref) => void;
}) {
  const options: { label: string; value: GenderPref }[] = [
    { label: "Any (auto-detect)", value: null },
    { label: "Men's", value: "Men" },
    { label: "Women's", value: "Women" },
  ];
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-6 space-y-4"
    >
      <div>
        <p className="text-sm font-semibold mb-2">Show me styles for</p>
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => onGenderChange(o.value)}
              className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                genderPref === o.value
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-glass-border text-muted-foreground hover:border-accent/60"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <label
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="relative block rounded-3xl border-2 border-dashed border-glass-border bg-card p-8 sm:p-12 text-center cursor-pointer hover:border-accent transition shadow-card"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <div className="h-16 w-16 rounded-2xl bg-aurora shadow-glow grid place-items-center mx-auto mb-4">
          <Upload className="h-7 w-7 text-white" />
        </div>
        <p className="font-display text-lg font-bold">Drop your photo here</p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse · JPG, PNG, WEBP
        </p>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => inputRef.current?.click()}
          size="lg"
          className="rounded-2xl h-14"
        >
          <ImageIcon className="h-4 w-4 mr-2" /> Choose file
        </Button>
        <Button
          onClick={onOpenCamera}
          variant="outline"
          size="lg"
          className="rounded-2xl h-14"
        >
          <Camera className="h-4 w-4 mr-2" /> Use camera
        </Button>
      </div>

      <div className="glass rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Your photo is used only for hairstyle analysis. Never stored or shared.
        </p>
      </div>
    </motion.div>
  );
}

function ScanningPhase({
  preview,
  step,
  steps,
}: {
  preview: string | null;
  step: number;
  steps: string[];
}) {
  return (
    <motion.div
      key="scan"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-6"
    >
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-primary shadow-elegant">
        {preview && (
          <img
            src={preview}
            alt="Analyzing"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/10 to-primary/40" />
        <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-accent/60 to-transparent animate-scan" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border-2 border-accent/50 animate-pulse-ring" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border-2 border-pink/50 animate-pulse-ring"
          style={{ animationDelay: "0.6s" }}
        />
        <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <p className="text-sm font-semibold">
            {step < steps.length ? steps[step] : "Done!"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
              i < step
                ? "bg-success/10 text-foreground"
                : i === step
                  ? "glass"
                  : "opacity-50"
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full grid place-items-center ${
                i < step
                  ? "bg-success text-white"
                  : i === step
                    ? "bg-accent text-white"
                    : "bg-muted"
              }`}
            >
              {i < step ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="text-xs">{i + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium">{s}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ErrorPhase({
  preview,
  step,
  steps,
  error,
  onRetry,
}: {
  preview: string | null;
  step: number;
  steps: string[];
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-6"
    >
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-primary shadow-elegant opacity-70">
        {preview && (
          <img
            src={preview}
            alt="Analysis failed"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-destructive/20 to-destructive/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-semibold text-destructive text-lg">Analysis failed</p>
        <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={onRetry} variant="default" className="rounded-xl">
            Try a different photo
          </Button>
          <Button
            onClick={() => {
              if (preview) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = preview;
              }
            }}
            variant="outline"
            className="rounded-xl"
          >
            Retry analysis
          </Button>
        </div>
      </div>

      <div className="space-y-2 opacity-60">
        {steps.map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <div
              className={`h-6 w-6 rounded-full grid place-items-center ${
                i < step ? "bg-destructive/20 text-destructive" : "bg-muted"
              }`}
            >
              {i < step ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <span className="text-xs">{i + 1}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CameraModal({
  videoRef,
  error,
  facingMode,
  onCapture,
  onClose,
  onFlip,
  onRetry,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  facingMode: "user" | "environment";
  onCapture: () => void;
  onClose: () => void;
  onFlip: () => void;
  onRetry: () => void;
}) {
  return (
    <motion.div
      key="camera-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20 transition"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-white font-semibold text-sm">Take a photo</p>
        <button
          onClick={onFlip}
          className="h-10 w-10 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20 transition"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Camera className="h-12 w-12 text-white/40" />
            <p className="text-white font-semibold">{error}</p>
            <Button onClick={onRetry} className="rounded-2xl">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Retry
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-72 rounded-full border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
            <p className="absolute bottom-36 left-0 right-0 text-center text-white/80 text-xs font-medium">
              Align your face inside the oval
            </p>
          </>
        )}
      </div>

      {!error && (
        <div className="shrink-0 flex items-center justify-center py-8">
          <button
            onClick={onCapture}
            className="h-20 w-20 rounded-full bg-white shadow-elegant flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Capture photo"
          >
            <div className="h-16 w-16 rounded-full bg-white border-4 border-gray-300" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
