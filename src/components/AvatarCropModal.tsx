import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "phosphor-react";

interface AvatarCropModalProps {
  src: string | null;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
  uploading: boolean;
}

// ── Constants ───────────────────────────────────────────────────
const VIEWPORT_SIZE = 300;
const CIRCLE_RADIUS = 106;
const OUTPUT_SIZE = 512; // final avatar resolution

// ── Helpers ────────────────────────────────────────────────────
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

function clampCircle(pos: { x: number; y: number }) {
  return {
    x: Math.min(VIEWPORT_SIZE - CIRCLE_RADIUS, Math.max(CIRCLE_RADIUS, pos.x)),
    y: Math.min(VIEWPORT_SIZE - CIRCLE_RADIUS, Math.max(CIRCLE_RADIUS, pos.y)),
  };
}

export default function AvatarCropModal({
  src,
  onCancel,
  onConfirm,
  uploading,
}: AvatarCropModalProps) {
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [circle, setCircle] = useState({
    x: VIEWPORT_SIZE / 2,
    y: VIEWPORT_SIZE / 2,
  });
  const [dragging, setDragging] = useState(false);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Reset when a new image is selected
  useEffect(() => {
    setImgSize(null);
    setZoom(1);
    setCircle({ x: VIEWPORT_SIZE / 2, y: VIEWPORT_SIZE / 2 });
    pointersRef.current.clear();
    pinchStartRef.current = null;
    if (!src) return;
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  const coverScale = imgSize
    ? Math.max(VIEWPORT_SIZE / imgSize.w, VIEWPORT_SIZE / imgSize.h)
    : 1;
  const scale = coverScale * zoom;

  // ── Pointer handling: 1 finger = move circle, 2 fingers = pinch zoom ──
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      setDragging(true);
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartRef.current = { dist, zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1 && dragging) {
      setCircle((c) => clampCircle({ x: c.x + dx, y: c.y + dy }));
    } else if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = [...pointersRef.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = Math.min(
        4,
        Math.max(1, pinchStartRef.current.zoom * (dist / pinchStartRef.current.dist))
      );
      setZoom(Number(next.toFixed(3)));
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    setDragging(pointersRef.current.size === 1);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((z) => Math.min(4, Math.max(1, Number((z + dir).toFixed(3)))));
  };

  // ── Crop the visible circle region and produce a file ─────────
  const handleApply = async () => {
    if (!src || !imgSize || uploading) return;
    try {
      const img = await loadImage(src);

      // Circle center offset from viewport center (viewport px) → image natural px
      const offX = circle.x - VIEWPORT_SIZE / 2;
      const offY = circle.y - VIEWPORT_SIZE / 2;
      const cx = imgSize.w / 2 + offX / scale;
      const cy = imgSize.h / 2 + offY / scale;
      const diameter = (CIRCLE_RADIUS * 2) / scale;

      // Clamp the square crop to image bounds
      const half = diameter / 2;
      let x0 = Math.max(0, cx - half);
      let y0 = Math.max(0, cy - half);
      x0 = Math.min(x0, Math.max(0, imgSize.w - diameter));
      y0 = Math.min(y0, Math.max(0, imgSize.h - diameter));
      const size = Math.min(diameter, imgSize.w, imgSize.h);

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, x0, y0, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1)
      );
      if (!blob) throw new Error("Failed to create image");
      await onConfirm(new File([blob], "avatar.png", { type: "image/png" }));
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  return (
    <AnimatePresence>
      {src && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !uploading && onCancel()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-5"
          >
            <div className="w-full max-w-[340px] bg-[#0b110d] border border-[#5CB010]/25 rounded-[24px] p-5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-[15px] text-white">
                    Adjust Photo
                  </h3>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Drag circle to move · pinch to zoom
                  </p>
                </div>
                <button
                  onClick={() => !uploading && onCancel()}
                  className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Crop viewport */}
              <div
                className="relative w-[300px] h-[300px] rounded-[18px] overflow-hidden bg-black mb-4 mx-auto touch-none select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
                onWheel={onWheel}
                style={{ cursor: dragging ? "grabbing" : "grab" }}
              >
                {/* Image — fixed, zoomed via scale */}
                {imgSize && (
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                    style={{
                      width: imgSize.w * scale,
                      height: imgSize.h * scale,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}

                {/* Draggable circle + grid */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: CIRCLE_RADIUS * 2,
                    height: CIRCLE_RADIUS * 2,
                    left: circle.x - CIRCLE_RADIUS,
                    top: circle.y - CIRCLE_RADIUS,
                    borderRadius: "50%",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                    border: "2px solid rgba(255,255,255,0.9)",
                  }}
                >
                  {/* Rule-of-thirds grid inside the circle */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/45" />
                    <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/45" />
                    <div className="absolute left-0 right-0 top-1/3 h-px bg-white/45" />
                    <div className="absolute left-0 right-0 top-2/3 h-px bg-white/45" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => !uploading && onCancel()}
                  className="flex-1 h-[42px] rounded-[13px] bg-white/[0.05] border border-white/[0.08] text-white/60 font-semibold text-[12px] hover:bg-white/[0.1] active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={uploading || !imgSize}
                  className="flex-1 h-[42px] rounded-[13px] bg-gradient-to-r from-[#73DA14] to-[#2E680A] text-[#050805] font-bold text-[12px] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Uploading
                    </>
                  ) : (
                    "Apply Photo"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}