import { useState, useRef, useCallback, useEffect } from "react";

export function useCamera() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const start = useCallback(async (mode: "user" | "environment" = facingMode) => {
    setError(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFound")) {
        setError("No camera found on this device.");
      } else {
        setError(`Could not start camera: ${msg}`);
      }
    }
  }, [facingMode, stop]);

  const flip = useCallback(async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    await start(next);
  }, [facingMode, start]);

  const capture = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stop();
    setOpen(false);
    return dataUrl;
  }, [facingMode, stop]);

  const openCamera = useCallback(() => setOpen(true), []);

  const close = useCallback(() => {
    stop();
    setOpen(false);
    setError(null);
  }, [stop]);

  useEffect(() => {
    if (open) {
      start(facingMode);
    } else {
      stop();
    }
    return () => {
      if (open) stop();
    };
  }, [open]);

  return {
    open,
    error,
    facingMode,
    videoRef,
    openCamera,
    close,
    flip,
    capture,
    retry: start,
  };
}
